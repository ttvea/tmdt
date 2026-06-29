package com.tmdt.web.service;

import com.tmdt.web.config.VNPayConfig;
import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.Refund;
import com.tmdt.web.entity.User;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.RefundRep;
import com.tmdt.web.repository.UserRep;
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
public class RefundService {

    private static final Logger log = LoggerFactory.getLogger(RefundService.class);

    private final RefundRep refundRepository;
    private final OrderRep orderRepository;
    private final UserRep userRepository;
    private final VNPayConfig vnPayConfig;

    /**
     * Admin tạo yêu cầu hoàn tiền từ dispute
     */
    @Transactional
    public Refund createRefund(Integer orderId, Double amount, Refund.RefundReason reason,
                                Integer disputeId, Integer adminId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy hóa đơn"));

        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw AppException.badRequest("Hóa đơn chưa được thanh toán, không thể hoàn tiền");
        }

        // Kiểm tra số tiền hoàn hợp lệ
        if (amount <= 0 || amount > order.getAmount()) {
            throw AppException.badRequest(
                    String.format("Số tiền hoàn phải từ 1 đến %.0f VND", order.getAmount()));
        }

        // Lấy thông tin tutor
        User tutor = userRepository.findById(order.getTutorClass().getTutorId().intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy gia sư"));

        Refund refund = Refund.builder()
                .orderId(orderId)
                .studentId(order.getStudentId())
                .tutorId(tutor.getId())
                .amount(amount)
                .disputeId(disputeId)
                .reason(reason)
                .status(Refund.RefundStatus.PENDING_REFUND)
                .build();

        Refund saved = refundRepository.save(refund);
        log.info("Refund created: id={}, orderId={}, amount={}, disputeId={}",
                saved.getId(), orderId, amount, disputeId);
        return saved;
    }

    /**
     * Tạo link VNPAY cho tutor thanh toán tiền hoàn
     */
    @Transactional
    public Refund createTutorPaymentUrl(Integer refundId) throws Exception {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hoàn tiền"));

        if (refund.getStatus() != Refund.RefundStatus.PENDING_REFUND) {
            throw AppException.badRequest("Yêu cầu hoàn tiền đã được xử lý");
        }

        // Tạo VNPAY URL cho tutor thanh toán
        String vnp_TxnRef = "REFUND_" + refundId + "_" + System.currentTimeMillis();
        String paymentUrl = buildVNPayUrl(vnp_TxnRef, refund.getAmount());

        refund.setVnpTxnRef(vnp_TxnRef);
        refund.setPaymentUrl(paymentUrl);
        refundRepository.save(refund);

        log.info("Tutor payment URL created for refund {}: {}", refundId, paymentUrl);
        return refund;
    }

    /**
     * Xử lý callback VNPAY từ tutor thanh toán hoàn tiền
     */
    @Transactional
    public Refund processTutorPaymentCallback(String vnp_TxnRef, String vnp_ResponseCode,
                                               String vnp_TransactionNo) {
        // Parse refundId từ vnp_TxnRef (format: REFUND_{id}_{timestamp})
        String[] parts = vnp_TxnRef.split("_");
        if (parts.length < 2) {
            throw AppException.badRequest("Mã tham chiếu không hợp lệ");
        }
        Integer refundId = Integer.parseInt(parts[1]);

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hoàn tiền"));

        refund.setVnpResponseCode(vnp_ResponseCode);
        refund.setVnpTransactionNo(vnp_TransactionNo);

        if ("00".equals(vnp_ResponseCode)) {
            // Thanh toán thành công
            refund.setStatus(Refund.RefundStatus.TUTOR_PAID);
            refund.setTutorPaidAt(new Date());
            log.info("Tutor paid for refund {}, transactionNo={}", refundId, vnp_TransactionNo);
        } else {
            // Thanh toán thất bại - vẫn giữ PENDING_REFUND để tutor có thể thử lại
            log.warn("Tutor payment failed for refund {}, responseCode={}", refundId, vnp_ResponseCode);
        }

        refundRepository.save(refund);
        return refund;
    }

    /**
     * Admin xác nhận hoàn tiền - cập nhật order và refund
     */
    @Transactional
    public Refund completeRefund(Integer refundId, Integer adminId) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hoàn tiền"));

        if (refund.getStatus() != Refund.RefundStatus.TUTOR_PAID) {
            throw AppException.badRequest("Gia sư chưa thanh toán hoàn tiền");
        }

        // Cập nhật refund
        refund.setStatus(Refund.RefundStatus.COMPLETED);
        refund.setCompletedAt(new Date());
        refundRepository.save(refund);

        // Cập nhật order
        Order order = orderRepository.findById(refund.getOrderId())
                .orElse(null);
        if (order != null) {
            order.setStatus(Order.OrderStatus.REFUNDED);
            order.setTutorPayoutStatus(Order.TutorPayoutStatus.REFUNDED);
            orderRepository.save(order);
        }

        log.info("Refund {} completed by admin {}, amount={}", refundId, adminId, refund.getAmount());
        return refund;
    }

    /**
     * Lấy danh sách refund (admin)
     */
    public List<Refund> getAllRefunds() {
        return refundRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Lấy refund theo trạng thái
     */
    public List<Refund> getRefundsByStatus(Refund.RefundStatus status) {
        return refundRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    /**
     * Lấy refund của một học viên
     */
    public List<Refund> getRefundsByStudent(Integer studentId) {
        return refundRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    /**
     * Lấy refund của một gia sư
     */
    public List<Refund> getRefundsByTutor(Integer tutorId) {
        return refundRepository.findByTutorIdOrderByCreatedAtDesc(tutorId);
    }

    /**
     * Xây dựng URL VNPAY cho tutor thanh toán hoàn tiền
     */
    private String buildVNPayUrl(String vnp_TxnRef, Double amount) throws Exception {
        String vnp_Amount = String.valueOf((int) Math.round(amount * 100));
        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", vnp_Amount);
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_Command", "pay");
        params.put("vnp_CreateDate", vnp_CreateDate);
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", "Hoan tien khoa hoc");
        params.put("vnp_OrderType", "other");
        // Dùng return URL riêng cho refund
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl().replace("vnpay-return", "vnpay-return-refund"));
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
            hashData.append(URLEncoder.encode(key, StandardCharsets.US_ASCII))
                    .append("=")
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
            first = false;
        }

        StringBuilder query = new StringBuilder();
        first = true;
        for (String key : keys) {
            String value = params.get(key);
            if (!first) query.append("&");
            query.append(URLEncoder.encode(key, StandardCharsets.US_ASCII))
                 .append("=")
                 .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
            first = false;
        }

        String vnp_SecureHash = hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        return vnPayConfig.getPayUrl() + "?" + query + "&vnp_SecureHash=" + vnp_SecureHash;
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