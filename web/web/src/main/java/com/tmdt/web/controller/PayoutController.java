package com.tmdt.web.controller;

import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.Payment;
import com.tmdt.web.entity.Payout;
import com.tmdt.web.entity.User;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.PaymentRep;
import com.tmdt.web.repository.PayoutRep;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.PayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class PayoutController {

    private final PayoutService payoutService;
    private final PayoutRep payoutRepository;
    private final OrderRep orderRepository;
    private final PaymentRep paymentRepository;
    private final JwtService jwtService;
    private final UserRep userRep;

    private Long getUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return (long) userRep.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"))
                .getId();
    }

    private User requireAdmin(String authHeader) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Khong tim thay nguoi dung"));
        if (user.getRole() != User.RoleAcc.ADMIN) {
            throw AppException.forbidden("Chi admin moi co quyen truy cap");
        }
        return user;
    }

    /**
     * API: Gia sư xem số dư khả dụng
     */
    @GetMapping("/api/tutor/payout/balance")
    public ResponseEntity<Map<String, Object>> getBalance(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);
        Double available = payoutService.getAvailableBalance(userId.intValue());
        Double pending = payoutService.getPendingPayoutRequestAmount(userId.intValue());
        Double withdrawable = payoutService.getWithdrawableBalance(userId.intValue());
        Double paidOut = payoutService.getTotalPaidOut(userId.intValue());

        Map<String, Object> result = new HashMap<>();
        result.put("availableBalance", available);
        result.put("pendingPayoutAmount", pending);
        result.put("withdrawableBalance", withdrawable);
        result.put("totalPaidOut", paidOut);
        return ResponseEntity.ok(result);
    }

    /**
     * API: Gia sư gửi yêu cầu rút tiền
     */
    @PostMapping("/api/tutor/payout/request")
    public ResponseEntity<Map<String, Object>> requestPayout(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        Long userId = getUserId(authHeader);

        // Kiểm tra role là TUTOR
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.TUTOR) {
            throw AppException.forbidden("Chỉ gia sư mới có thể yêu cầu rút tiền");
        }

        Double amount = body.get("amount") != null ? Double.valueOf(body.get("amount").toString()) : 0;
        String note = (String) body.getOrDefault("note", "");
        String bankName = (String) body.getOrDefault("bankName", "");
        String bankAccount = (String) body.getOrDefault("bankAccount", "");
        String bankHolder = (String) body.getOrDefault("bankHolder", "");

        Payout payout = payoutService.requestPayout(userId.intValue(), amount, note, bankName, bankAccount, bankHolder);

        Map<String, Object> result = new HashMap<>();
        result.put("id", payout.getId());
        result.put("amount", payout.getAmount());
        result.put("status", payout.getStatus().name());
        result.put("paymentMethod", payout.getPaymentMethod());
        result.put("providerTransactionId", payout.getProviderTransactionId());
        result.put("createdAt", payout.getCreatedAt());
        result.put("message", "Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin xử lý.");
        return ResponseEntity.ok(result);
    }

    /**
     * API: Gia sư xem lịch sử rút tiền
     */
    @GetMapping("/api/tutor/payout/history")
    public ResponseEntity<List<Map<String, Object>>> getPayoutHistory(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);

        List<Payout> payouts = payoutService.getTutorPayoutHistory(userId.intValue());

        List<Map<String, Object>> result = payouts.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("amount", p.getAmount());
            map.put("status", p.getStatus().name());
            map.put("note", p.getNote());
            map.put("bankName", p.getBankName());
            map.put("bankAccount", p.getBankAccount());
            map.put("bankHolder", p.getBankHolder());
            map.put("createdAt", p.getCreatedAt());
            map.put("completedAt", p.getCompletedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * API: Gia sư xem các order đang chờ payout
     */
    @GetMapping("/api/tutor/payout/pending-orders")
    public ResponseEntity<List<Map<String, Object>>> getPendingOrders(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);

        List<Order> pendingOrders = payoutService.getPendingOrdersForTutor(userId.intValue());

        List<Map<String, Object>> result = pendingOrders.stream().map(o -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId());
            map.put("studentId", o.getStudentId());
            map.put("className", o.getTutorClass().getTitle());
            map.put("amount", o.getAmount());
            map.put("tutorEarning", o.getTutorEarning());
            double tutorEarning = o.getTutorEarning() != null ? o.getTutorEarning() : 0.0;
            double tutorPayoutPaidAmount = o.getTutorPayoutPaidAmount() != null ? o.getTutorPayoutPaidAmount() : 0.0;
            map.put("tutorPayoutPaidAmount", tutorPayoutPaidAmount);
            map.put("tutorPayoutRemainingAmount", Math.max(0.0, tutorEarning - tutorPayoutPaidAmount));
            map.put("platformFee", o.getPlatformFee());
            map.put("paidAt", o.getPaidAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ======================== ADMIN APIs ========================

    /**
     * API: Admin xem tất cả yêu cầu payout
     */
    @GetMapping("/api/admin/payouts")
    public ResponseEntity<List<Map<String, Object>>> getAllPayouts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String status) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.ADMIN) {
            throw AppException.forbidden("Chỉ admin mới có quyền truy cập");
        }

        Payout.PayoutStatus filterStatus = null;
        if (status != null && !status.isEmpty()) {
            filterStatus = Payout.PayoutStatus.valueOf(status.toUpperCase());
        }

        List<Payout> payouts = payoutService.getAllPayouts(filterStatus);

        List<Map<String, Object>> result = payouts.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("tutorId", p.getTutorId());
            // Lấy tên gia sư
            String tutorName = userRep.findById(p.getTutorId())
                    .map(User::getFullName)
                    .orElse("Unknown");
            map.put("tutorName", tutorName);
            map.put("amount", p.getAmount());
            map.put("status", p.getStatus().name());
            map.put("note", p.getNote());
            map.put("paymentMethod", p.getPaymentMethod());
            map.put("providerTransactionId", p.getProviderTransactionId());
            map.put("providerNote", p.getProviderNote());
            map.put("bankName", p.getBankName());
            map.put("bankAccount", p.getBankAccount());
            map.put("bankHolder", p.getBankHolder());
            map.put("createdAt", p.getCreatedAt());
            map.put("completedAt", p.getCompletedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * API: Admin duyệt payout (xác nhận đã chuyển tiền)
     */
    @GetMapping("/api/admin/payment-transactions")
    public ResponseEntity<List<Map<String, Object>>> getPaymentTransactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String type) {
        requireAdmin(authHeader);

        String filterType = type != null && !type.isBlank() ? type.trim().toUpperCase() : null;
        List<Map<String, Object>> result = new ArrayList<>();

        if (filterType == null || filterType.equals("COURSE_PAYMENT")) {
            for (Payment payment : paymentRepository.findAll()) {
                Order order = payment.getOrder();
                if (order == null) continue;

                Map<String, Object> map = new HashMap<>();
                map.put("id", "PAY-" + payment.getId());
                map.put("type", "COURSE_PAYMENT");
                map.put("direction", "IN");
                map.put("amount", order.getAmount());
                map.put("platformFee", order.getPlatformFee());
                map.put("tutorEarning", order.getTutorEarning());
                map.put("status", payment.getStatus() != null ? payment.getStatus().name() : order.getStatus().name());
                map.put("method", payment.getProvider() != null ? payment.getProvider().name() : "UNKNOWN");
                map.put("transactionId", payment.getTransactionId());
                map.put("orderId", order.getId());
                map.put("classId", order.getTutorClass() != null ? order.getTutorClass().getId() : null);
                map.put("classTitle", order.getTutorClass() != null ? order.getTutorClass().getTitle() : null);
                map.put("studentId", order.getStudentId());
                map.put("studentName", userRep.findById(order.getStudentId()).map(User::getFullName).orElse("Unknown"));
                Integer tutorId = order.getTutorClass() != null ? order.getTutorClass().getTutorId().intValue() : null;
                map.put("tutorId", tutorId);
                map.put("tutorName", tutorId != null ? userRep.findById(tutorId).map(User::getFullName).orElse("Unknown") : "Unknown");
                map.put("createdAt", order.getDateCreate());
                map.put("paidAt", payment.getPaidAt() != null ? payment.getPaidAt() : order.getPaidAt());
                result.add(map);
            }
        }

        if (filterType == null || filterType.equals("TUTOR_PAYOUT")) {
            for (Payout payout : payoutRepository.findAll()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", "PO-" + payout.getId());
                map.put("type", "TUTOR_PAYOUT");
                map.put("direction", "OUT");
                map.put("amount", payout.getAmount());
                map.put("platformFee", null);
                map.put("tutorEarning", payout.getAmount());
                map.put("status", payout.getStatus().name());
                map.put("method", payout.getPaymentMethod());
                map.put("transactionId", payout.getProviderTransactionId());
                map.put("orderId", null);
                map.put("classId", null);
                map.put("classTitle", null);
                map.put("studentId", null);
                map.put("studentName", null);
                map.put("tutorId", payout.getTutorId());
                map.put("tutorName", userRep.findById(payout.getTutorId()).map(User::getFullName).orElse("Unknown"));
                map.put("createdAt", payout.getCreatedAt());
                map.put("paidAt", payout.getCompletedAt());
                result.add(map);
            }
        }

        result.sort((a, b) -> {
            Date left = (Date) Optional.ofNullable(a.get("paidAt")).orElse(a.get("createdAt"));
            Date right = (Date) Optional.ofNullable(b.get("paidAt")).orElse(b.get("createdAt"));
            if (left == null && right == null) return 0;
            if (left == null) return 1;
            if (right == null) return -1;
            return right.compareTo(left);
        });

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/admin/payouts/{payoutId}/approve")
    public ResponseEntity<Map<String, Object>> approvePayout(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer payoutId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.ADMIN) {
            throw AppException.forbidden("Chỉ admin mới có quyền duyệt payout");
        }

        String adminNote = body != null ? (String) body.get("note") : null;
        String paymentMethod = body != null ? (String) body.get("paymentMethod") : null;
        String providerTransactionId = body != null ? (String) body.get("providerTransactionId") : null;
        String providerNote = body != null ? (String) body.get("providerNote") : null;
        Payout payout = payoutService.approvePayout(
                payoutId,
                adminNote,
                paymentMethod,
                providerTransactionId,
                providerNote
        );

        Map<String, Object> result = new HashMap<>();
        result.put("id", payout.getId());
        result.put("status", payout.getStatus().name());
        result.put("paymentMethod", payout.getPaymentMethod());
        result.put("providerTransactionId", payout.getProviderTransactionId());
        result.put("message", "Payout đã được duyệt thành công");
        return ResponseEntity.ok(result);
    }

    /**
     * API: Admin từ chối payout
     */
    @PostMapping("/api/admin/payouts/{payoutId}/reject")
    public ResponseEntity<Map<String, Object>> rejectPayout(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer payoutId,
            @RequestBody Map<String, Object> body) {
        Long userId = getUserId(authHeader);
        User user = userRep.findById(userId.intValue())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() != User.RoleAcc.ADMIN) {
            throw AppException.forbidden("Chỉ admin mới có quyền từ chối payout");
        }

        String reason = (String) body.getOrDefault("reason", "Yêu cầu bị từ chối bởi admin");
        Payout payout = payoutService.rejectPayout(payoutId, reason);

        Map<String, Object> result = new HashMap<>();
        result.put("id", payout.getId());
        result.put("status", payout.getStatus().name());
        result.put("message", "Payout đã bị từ chối");
        return ResponseEntity.ok(result);
    }
}
