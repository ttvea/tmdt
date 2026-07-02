package com.tmdt.web.controller;

import com.tmdt.web.entity.PlatformFeePayment;
import com.tmdt.web.entity.User;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.PlatformFeeService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class PlatformFeeController {

    private final PlatformFeeService platformFeeService;
    private final JwtService jwtService;
    private final UserRep userRep;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private Long getUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return (long) userRep.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"))
                .getId();
    }

    /**
     * API: Gia sư xem tổng phí nền tảng chưa thanh toán
     */
    @GetMapping("/api/tutor/platform-fee/summary")
    public ResponseEntity<Map<String, Object>> getFeeSummary(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.TUTOR) {
            throw AppException.forbidden("Chỉ gia sư mới có quyền truy cập");
        }

        Double totalPending = platformFeeService.getTotalPendingFee(userId.intValue());
        List<PlatformFeePayment> pendingFees = platformFeeService.getPendingFees(userId.intValue());

        Map<String, Object> result = new HashMap<>();
        result.put("totalPendingFee", totalPending);
        result.put("pendingCount", pendingFees.size());
        return ResponseEntity.ok(result);
    }

    /**
     * API: Gia sư xem danh sách phí nền tảng chưa thanh toán
     */
    @GetMapping("/api/tutor/platform-fee/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingFees(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.TUTOR) {
            throw AppException.forbidden("Chỉ gia sư mới có quyền truy cập");
        }

        List<PlatformFeePayment> pendingFees = platformFeeService.getPendingFees(userId.intValue());

        List<Map<String, Object>> result = pendingFees.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("orderId", f.getOrderId());
            map.put("amount", f.getAmount());
            map.put("status", f.getStatus().name());
            map.put("paymentUrl", f.getPaymentUrl());
            map.put("createdAt", f.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * API: Gia sư xem lịch sử thanh toán phí nền tảng
     */
    @GetMapping("/api/tutor/platform-fee/history")
    public ResponseEntity<List<Map<String, Object>>> getFeeHistory(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.TUTOR) {
            throw AppException.forbidden("Chỉ gia sư mới có quyền truy cập");
        }

        List<PlatformFeePayment> history = platformFeeService.getPaymentHistory(userId.intValue());

        List<Map<String, Object>> result = history.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("orderId", f.getOrderId());
            map.put("amount", f.getAmount());
            map.put("status", f.getStatus().name());
            map.put("vnpTransactionNo", f.getVnpTransactionNo());
            map.put("paidAt", f.getPaidAt());
            map.put("createdAt", f.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * API: Tạo VNPAY URL để thanh toán phí nền tảng
     */
    @PostMapping("/api/tutor/platform-fee/pay/{feePaymentId}")
    public ResponseEntity<Map<String, Object>> payPlatformFee(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer feePaymentId) throws Exception {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.TUTOR) {
            throw AppException.forbidden("Chỉ gia sư mới có quyền truy cập");
        }

        String paymentUrl = platformFeeService.createVNPayUrl(feePaymentId);

        Map<String, Object> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);
        return ResponseEntity.ok(result);
    }

    /**
     * API: VNPAY return callback cho platform fee
     */
    @GetMapping("/api/platform-fee/vnpay-return")
    @Transactional
    public void vnpayReturn(
            @RequestParam String vnp_ResponseCode,
            @RequestParam String vnp_TxnRef,
            @RequestParam(required = false) String vnp_TransactionNo,
            HttpServletResponse response) throws Exception {

        platformFeeService.handleVNPayReturn(vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo);

        // Redirect về frontend trang payout
        response.sendRedirect(frontendUrl + "/tutor/payout");
    }

    // ======================== ADMIN APIs ========================

    /**
     * API: Admin xem tất cả phí nền tảng
     */
    @GetMapping("/api/admin/platform-fees")
    public ResponseEntity<List<Map<String, Object>>> getAllFeePayments(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String status) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.ADMIN) {
            throw AppException.forbidden("Chỉ admin mới có quyền truy cập");
        }

        PlatformFeePayment.FeePaymentStatus filterStatus = null;
        if (status != null && !status.isEmpty()) {
            filterStatus = PlatformFeePayment.FeePaymentStatus.valueOf(status.toUpperCase());
        }

        List<PlatformFeePayment> fees = platformFeeService.getAllFeePayments(filterStatus);

        List<Map<String, Object>> result = fees.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("tutorId", f.getTutorId());
            String tutorName = userRep.findById(f.getTutorId())
                    .map(User::getFullName)
                    .orElse("Unknown");
            map.put("tutorName", tutorName);
            map.put("orderId", f.getOrderId());
            map.put("amount", f.getAmount());
            map.put("status", f.getStatus().name());
            map.put("vnpTransactionNo", f.getVnpTransactionNo());
            map.put("paidAt", f.getPaidAt());
            map.put("createdAt", f.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}