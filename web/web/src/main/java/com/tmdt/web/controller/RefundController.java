package com.tmdt.web.controller;

import com.tmdt.web.entity.Refund;
import com.tmdt.web.entity.User;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.RefundService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class RefundController {

    private static final Logger log = LoggerFactory.getLogger(RefundController.class);

    private final RefundService refundService;
    private final JwtService jwtService;
    private final UserRep userRep;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private User getUserFromAuth(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return userRep.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
    }

    /**
     * Admin: Lấy danh sách hoàn tiền
     */
    @GetMapping("/api/admin/refunds")
    public ResponseEntity<List<Map<String, Object>>> getRefunds(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String status) {
        User admin = getUserFromAuth(authHeader);
        if (!"ADMIN".equals(admin.getRole().name())) {
            throw AppException.forbidden("Bạn không có quyền truy cập");
        }

        List<Refund> refunds;
        if (status != null && !status.isEmpty()) {
            refunds = refundService.getRefundsByStatus(Refund.RefundStatus.valueOf(status));
        } else {
            refunds = refundService.getAllRefunds();
        }

        List<Map<String, Object>> result = refunds.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Admin: Tạo yêu cầu hoàn tiền từ dispute
     */
    @PostMapping("/api/admin/refunds")
    public ResponseEntity<Map<String, Object>> createRefund(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        User admin = getUserFromAuth(authHeader);
        if (!"ADMIN".equals(admin.getRole().name())) {
            throw AppException.forbidden("Bạn không có quyền truy cập");
        }

        Integer orderId = Integer.parseInt(body.get("orderId").toString());
        Double amount = Double.parseDouble(body.get("amount").toString());
        String reasonStr = (String) body.get("reason");
        Refund.RefundReason reason = Refund.RefundReason.valueOf(reasonStr);
        Integer disputeId = body.containsKey("disputeId") && body.get("disputeId") != null
                ? Integer.parseInt(body.get("disputeId").toString()) : null;

        Refund refund = refundService.createRefund(orderId, amount, reason, disputeId, admin.getId());
        return ResponseEntity.ok(toMap(refund));
    }

    /**
     * Admin: Tạo link VNPAY cho tutor thanh toán hoàn tiền
     */
    @PostMapping("/api/admin/refunds/{refundId}/payment-url")
    public ResponseEntity<Map<String, Object>> createTutorPaymentUrl(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer refundId) throws Exception {
        User admin = getUserFromAuth(authHeader);
        if (!"ADMIN".equals(admin.getRole().name())) {
            throw AppException.forbidden("Bạn không có quyền truy cập");
        }

        Refund refund = refundService.createTutorPaymentUrl(refundId);
        return ResponseEntity.ok(toMap(refund));
    }

    /**
     * Admin: Xác nhận hoàn tiền
     */
    @PostMapping("/api/admin/refunds/{refundId}/complete")
    public ResponseEntity<Map<String, Object>> completeRefund(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer refundId) {
        User admin = getUserFromAuth(authHeader);
        if (!"ADMIN".equals(admin.getRole().name())) {
            throw AppException.forbidden("Bạn không có quyền truy cập");
        }

        Refund refund = refundService.completeRefund(refundId, admin.getId());
        return ResponseEntity.ok(toMap(refund));
    }

    /**
     * Student: Xem lịch sử hoàn tiền
     */
    @GetMapping("/api/student/refunds")
    public ResponseEntity<List<Map<String, Object>>> getStudentRefunds(
            @RequestHeader("Authorization") String authHeader) {
        User student = getUserFromAuth(authHeader);
        List<Refund> refunds = refundService.getRefundsByStudent(student.getId());
        List<Map<String, Object>> result = refunds.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Tutor: Xem lịch sử hoàn tiền
     */
    @GetMapping("/api/tutor/refunds")
    public ResponseEntity<List<Map<String, Object>>> getTutorRefunds(
            @RequestHeader("Authorization") String authHeader) {
        User tutor = getUserFromAuth(authHeader);
        List<Refund> refunds = refundService.getRefundsByTutor(tutor.getId());
        List<Map<String, Object>> result = refunds.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Tutor: Tạo link VNPAY thanh toán hoàn tiền (không cần admin)
     */
    @PostMapping("/api/tutor/refunds/{refundId}/pay")
    public ResponseEntity<Map<String, Object>> tutorPayRefund(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer refundId) throws Exception {
        User tutor = getUserFromAuth(authHeader);

        // Kiểm tra refund thuộc về tutor này
        Refund existing = refundService.getRefundsByTutor(tutor.getId()).stream()
                .filter(r -> r.getId().equals(refundId))
                .findFirst()
                .orElseThrow(() -> AppException.forbidden("Bạn không có quyền thanh toán yêu cầu này"));

        Refund refund = refundService.createTutorPaymentUrl(refundId);
        return ResponseEntity.ok(toMap(refund));
    }

    /**
     * VNPAY return callback cho refund (tutor thanh toán tiền hoàn)
     */
    @GetMapping("/api/payment/vnpay-return-refund")
    @Transactional
    public void vnpayRefundReturn(
            @RequestParam String vnp_ResponseCode,
            @RequestParam String vnp_TxnRef,
            @RequestParam(required = false) String vnp_TransactionNo,
            HttpServletResponse response) throws Exception {
        log.info("VNPay refund return: txnRef={}, responseCode={}", vnp_TxnRef, vnp_ResponseCode);

        try {
            refundService.processTutorPaymentCallback(vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo);
        } catch (Exception e) {
            log.error("Error processing refund callback: {}", e.getMessage());
        }

        // Redirect về trang tutor refunds
        response.sendRedirect(frontendUrl + "/tutor/refunds");
    }

    /**
     * Map entity to response map
     */
    private Map<String, Object> toMap(Refund refund) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", refund.getId());
        map.put("orderId", refund.getOrderId());
        map.put("studentId", refund.getStudentId());
        map.put("tutorId", refund.getTutorId());
        map.put("amount", refund.getAmount());
        map.put("disputeId", refund.getDisputeId());
        map.put("reason", refund.getReason().name());
        map.put("status", refund.getStatus().name());
        map.put("vnpTxnRef", refund.getVnpTxnRef());
        map.put("vnpTransactionNo", refund.getVnpTransactionNo());
        map.put("vnpResponseCode", refund.getVnpResponseCode());
        map.put("paymentUrl", refund.getPaymentUrl());
        map.put("tutorPaidAt", refund.getTutorPaidAt());
        map.put("completedAt", refund.getCompletedAt());
        map.put("createdAt", refund.getCreatedAt());
        map.put("updatedAt", refund.getUpdatedAt());
        return map;
    }
}