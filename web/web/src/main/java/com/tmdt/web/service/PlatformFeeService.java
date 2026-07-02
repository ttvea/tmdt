package com.tmdt.web.service;

import com.tmdt.web.config.VNPayConfig;
import com.tmdt.web.entity.PlatformFeePayment;
import com.tmdt.web.entity.Order;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.PlatformFeePaymentRep;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PlatformFeeService {

    private static final Logger log = LoggerFactory.getLogger(PlatformFeeService.class);

    private final PlatformFeePaymentRep platformFeePaymentRep;
    private final VNPayConfig vnPayConfig;

    /**
     * Tạo PlatformFeePayment record khi gia sư xác nhận nhận tiền mặt từ học viên.
     * Ghi nhận khoản phí nền tảng 10% mà gia sư cần thanh toán.
     */
    @Transactional
    public PlatformFeePayment createFeePayment(Order order) {
        Double platformFee = order.getPlatformFee();
        if (platformFee == null || platformFee <= 0) {
            throw AppException.badRequest("Không có phí nền tảng để thanh toán");
        }

        Integer tutorId = order.getTutorClass().getTutorId().intValue();

        // Kiểm tra đã có PlatformFeePayment cho order này chưa
        List<PlatformFeePayment> existing = platformFeePaymentRep.findByOrderId(order.getId());
        boolean alreadyExists = existing.stream()
                .anyMatch(f -> f.getStatus() == PlatformFeePayment.FeePaymentStatus.PENDING
                        || f.getStatus() == PlatformFeePayment.FeePaymentStatus.PAID);
        if (alreadyExists) {
            log.warn("PlatformFeePayment already exists for orderId={}, skipping", order.getId());
            return existing.stream()
                    .filter(f -> f.getStatus() == PlatformFeePayment.FeePaymentStatus.PENDING
                            || f.getStatus() == PlatformFeePayment.FeePaymentStatus.PAID)
                    .findFirst().orElse(null);
        }

        PlatformFeePayment feePayment = PlatformFeePayment.builder()
                .tutorId(tutorId)
                .orderId(order.getId())
                .amount(platformFee)
                .status(PlatformFeePayment.FeePaymentStatus.PENDING)
                .build();

        PlatformFeePayment saved = platformFeePaymentRep.save(feePayment);
        log.info("Created PlatformFeePayment id={}, tutorId={}, orderId={}, amount={}",
                saved.getId(), tutorId, order.getId(), platformFee);
        return saved;
    }

    /**
     * Tạo VNPAY URL để thanh toán phí nền tảng
     */
    public String createVNPayUrl(Integer feePaymentId) throws Exception {
        PlatformFeePayment feePayment = platformFeePaymentRep.findById(feePaymentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy khoản phí nền tảng"));

        if (feePayment.getStatus() != PlatformFeePayment.FeePaymentStatus.PENDING) {
            throw AppException.badRequest("Khoản phí này đã được thanh toán hoặc đã hết hạn");
        }

        String vnp_TxnRef = "FEE-" + feePaymentId + "-" + System.currentTimeMillis() % 10000;
        String vnp_Amount = String.valueOf((int) Math.round(feePayment.getAmount() * 100));
        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", vnp_Amount);
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_Command", "pay");
        params.put("vnp_CreateDate", vnp_CreateDate);
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", "Thanh toan phi nen tang");
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl().replace("/api/payment/vnpay-return", "/api/platform-fee/vnpay-return"));
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_TxnRef", vnp_TxnRef);
        params.put("vnp_Version", "2.1.0");

        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);

        StringBuilder hashData = new StringBuilder();
        boolean first = true;
        for (String key : keys) {
            String value = params.get(key);
            if (!first) hashData.append("&");
            hashData.append(URLEncoder.encode(key, StandardCharsets.US_ASCII.toString()))
                    .append("=")
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()));
            first = false;
        }

        StringBuilder query = new StringBuilder();
        first = true;
        for (String key : keys) {
            String value = params.get(key);
            if (!first) query.append("&");
            query.append(URLEncoder.encode(key, StandardCharsets.US_ASCII.toString()))
                    .append("=")
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()));
            first = false;
        }

        log.info("=== VNPAY PLATFORM FEE HASH DATA ===");
        log.info("HashData: {}", hashData);

        String vnp_SecureHash = hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        String fullUrl = vnPayConfig.getPayUrl() + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;

        // Lưu payment_url và vnp_TxnRef
        feePayment.setPaymentUrl(fullUrl);
        feePayment.setVnpTxnRef(vnp_TxnRef);
        platformFeePaymentRep.save(feePayment);

        log.info("Platform fee VNPAY URL created for feePaymentId={}: {}", feePaymentId, fullUrl);
        return fullUrl;
    }

    /**
     * Xử lý kết quả thanh toán VNPAY callback
     */
    @Transactional
    public PlatformFeePayment handleVNPayReturn(String vnp_ResponseCode, String vnp_TxnRef,
                                                  String vnp_TransactionNo) {
        // Parse feePaymentId từ vnp_TxnRef (format: "FEE-{id}-{suffix}")
        Integer feePaymentId;
        try {
            String[] parts = vnp_TxnRef.split("-");
            feePaymentId = Integer.parseInt(parts[1]);
        } catch (Exception e) {
            throw AppException.badRequest("Mã giao dịch không hợp lệ: " + vnp_TxnRef);
        }

        PlatformFeePayment feePayment = platformFeePaymentRep.findById(feePaymentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy khoản phí nền tảng"));

        feePayment.setVnpTxnRef(vnp_TxnRef);
        feePayment.setVnpTransactionNo(vnp_TransactionNo);
        feePayment.setVnpResponseCode(vnp_ResponseCode);

        if ("00".equals(vnp_ResponseCode)) {
            boolean alreadyPaid = feePayment.getStatus() == PlatformFeePayment.FeePaymentStatus.PAID;
            if (!alreadyPaid) {
                feePayment.setStatus(PlatformFeePayment.FeePaymentStatus.PAID);
                feePayment.setPaidAt(new Date());
                log.info("PlatformFeePayment {} paid successfully via VNPAY, txnNo={}",
                        feePaymentId, vnp_TransactionNo);
            }
        } else {
            feePayment.setStatus(PlatformFeePayment.FeePaymentStatus.FAILED);
            log.warn("PlatformFeePayment {} failed, vnp_ResponseCode={}", feePaymentId, vnp_ResponseCode);
        }

        return platformFeePaymentRep.save(feePayment);
    }

    /**
     * Lấy danh sách phí nền tảng chưa thanh toán của gia sư
     */
    public List<PlatformFeePayment> getPendingFees(Integer tutorId) {
        return platformFeePaymentRep.findByTutorIdAndStatusOrderByCreatedAtDesc(
                tutorId, PlatformFeePayment.FeePaymentStatus.PENDING);
    }

    /**
     * Lấy tổng phí nền tảng chưa thanh toán của gia sư
     */
    public Double getTotalPendingFee(Integer tutorId) {
        List<PlatformFeePayment> pendingFees = getPendingFees(tutorId);
        return pendingFees.stream()
                .mapToDouble(PlatformFeePayment::getAmount)
                .sum();
    }

    /**
     * Lấy lịch sử thanh toán phí nền tảng
     */
    public List<PlatformFeePayment> getPaymentHistory(Integer tutorId) {
        return platformFeePaymentRep.findByTutorIdOrderByCreatedAtDesc(tutorId);
    }

    /**
     * Admin: Lấy tất cả phí nền tảng
     */
    public List<PlatformFeePayment> getAllFeePayments(PlatformFeePayment.FeePaymentStatus status) {
        if (status != null) {
            return platformFeePaymentRep.findByStatusOrderByCreatedAtDesc(status);
        }
        return platformFeePaymentRep.findAll();
    }

    private String hmacSHA512(String key, String data) throws Exception {
        Mac hmac512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac512.init(secretKeySpec);
        byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            hash.append(String.format("%02x", b));
        }
        return hash.toString();
    }
}