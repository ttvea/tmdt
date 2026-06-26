package com.tmdt.web.controller;

import com.tmdt.web.dto.response.OrderDetailResponse;
import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.Payment;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.entity.User;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.Calendar;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderRep orderRepository;
    private final ClassRep classRepository;
    private final JwtService jwtService;
    private final UserRep userRep;
    private final EnrollmentRep enrollmentRepository;

    private Long getUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return (long) userRep.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"))
                .getId();
    }

    @GetMapping("/api/classes/{classId}/orders")
    public ResponseEntity<List<Map<String, Object>>> getOrdersByClass(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long classId) {
        Long userId = getUserId(authHeader);

        TutorClass classEntity = classRepository.findById(classId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        if (!classEntity.getTutorId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền xem hóa đơn của lớp này");
        }

        List<Order> orders = classEntity.getOrders();
        List<Map<String, Object>> result = orders.stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("studentId", order.getStudentId());
            map.put("classId", classEntity.getId());
            map.put("className", classEntity.getTitle());
            map.put("amount", order.getAmount());
            map.put("commissionRate", order.getCommissionRate());
            map.put("platformFee", order.getPlatformFee());
            map.put("tutorEarning", order.getTutorEarning());
            map.put("tutorPayoutStatus", order.getTutorPayoutStatus() != null ? order.getTutorPayoutStatus().name() : null);
            map.put("tutorPayoutAt", order.getTutorPayoutAt());
            map.put("status", order.getStatus().name());
            map.put("vnpTxnRef", order.getVnpTxnRef());
            map.put("vnpTransactionNo", order.getVnpTransactionNo());
            map.put("vnpResponseCode", order.getVnpResponseCode());
            map.put("paymentUrl", order.getPaymentUrl());
            map.put("dateCreate", order.getDateCreate());
            map.put("paidAt", order.getPaidAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/orders/my")
    public ResponseEntity<List<Map<String, Object>>> getMyOrders(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getStudentId() == userId.intValue())
                .collect(Collectors.toList());

        List<Map<String, Object>> result = orders.stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("studentId", order.getStudentId());
            map.put("classId", order.getTutorClass().getId());
            map.put("className", order.getTutorClass().getTitle());
            map.put("amount", order.getAmount());
            map.put("commissionRate", order.getCommissionRate());
            map.put("platformFee", order.getPlatformFee());
            map.put("tutorEarning", order.getTutorEarning());
            map.put("tutorPayoutStatus", order.getTutorPayoutStatus() != null ? order.getTutorPayoutStatus().name() : null);
            map.put("tutorPayoutAt", order.getTutorPayoutAt());
            map.put("status", order.getStatus().name());
            map.put("vnpTxnRef", order.getVnpTxnRef());
            map.put("vnpTransactionNo", order.getVnpTransactionNo());
            map.put("vnpResponseCode", order.getVnpResponseCode());
            map.put("paymentUrl", order.getPaymentUrl());
            map.put("dateCreate", order.getDateCreate());
            map.put("paidAt", order.getPaidAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/tutor/{tutorId}/revenue")
    public ResponseEntity<Map<String, Object>> getTutorRevenue(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long tutorId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        Long userId = getUserId(authHeader);
        if (!userId.equals(tutorId)) {
            throw AppException.forbidden("Bạn không có quyền xem doanh thu này");
        }

        List<Order> tutorOrders = orderRepository.findAll().stream()
                .filter(o -> o.getTutorClass().getTutorId().equals(tutorId))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .collect(Collectors.toList());

        // Date range filtering
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date from = null;
        Date to = null;
        try {
            if (fromDate != null && !fromDate.isEmpty()) {
                from = sdf.parse(fromDate);
            }
            if (toDate != null && !toDate.isEmpty()) {
                to = sdf.parse(toDate);
                // Set to end of day
                Calendar cal = Calendar.getInstance();
                cal.setTime(to);
                cal.set(Calendar.HOUR_OF_DAY, 23);
                cal.set(Calendar.MINUTE, 59);
                cal.set(Calendar.SECOND, 59);
                to = cal.getTime();
            }
        } catch (Exception e) {
            // ignore parse errors
        }

        Date finalFrom = from;
        Date finalTo = to;
        List<Order> filteredOrders = tutorOrders.stream()
                .filter(o -> {
                    Date paidDate = o.getPaidAt();
                    if (paidDate == null) return false;
                    if (finalFrom != null && paidDate.before(finalFrom)) return false;
                    if (finalTo != null && paidDate.after(finalTo)) return false;
                    return true;
                })
                .collect(Collectors.toList());

        int totalOrders = filteredOrders.size();
        double totalAmount = filteredOrders.stream().mapToDouble(Order::getAmount).sum();
        double totalPlatformFee = filteredOrders.stream().mapToDouble(o -> o.getPlatformFee() != null ? o.getPlatformFee() : 0.0).sum();
        double totalTutorEarning = filteredOrders.stream().mapToDouble(o -> o.getTutorEarning() != null ? o.getTutorEarning() : 0.0).sum();

        Map<String, Object> result = new HashMap<>();
        result.put("totalOrders", totalOrders);
        result.put("totalAmount", totalAmount);
        result.put("totalPlatformFee", totalPlatformFee);
        result.put("totalTutorEarning", totalTutorEarning);
        result.put("fromDate", fromDate);
        result.put("toDate", toDate);

        return ResponseEntity.ok(result);
    }

    /**
     * API mới: Trả về doanh thu theo từng tháng để vẽ biểu đồ cột
     */
    @GetMapping("/api/tutor/{tutorId}/revenue/monthly")
    public ResponseEntity<List<Map<String, Object>>> getTutorRevenueMonthly(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long tutorId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        Long userId = getUserId(authHeader);
        if (!userId.equals(tutorId)) {
            throw AppException.forbidden("Bạn không có quyền xem doanh thu này");
        }

        List<Order> tutorOrders = orderRepository.findAll().stream()
                .filter(o -> o.getTutorClass().getTutorId().equals(tutorId))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .collect(Collectors.toList());

        // Date range filtering
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date from = null;
        Date to = null;
        try {
            if (fromDate != null && !fromDate.isEmpty()) {
                from = sdf.parse(fromDate);
            }
            if (toDate != null && !toDate.isEmpty()) {
                to = sdf.parse(toDate);
                Calendar cal = Calendar.getInstance();
                cal.setTime(to);
                cal.set(Calendar.HOUR_OF_DAY, 23);
                cal.set(Calendar.MINUTE, 59);
                cal.set(Calendar.SECOND, 59);
                to = cal.getTime();
            }
        } catch (Exception e) {
            // ignore parse errors
        }

        Date finalFrom = from;
        Date finalTo = to;

        // Group by year-month
        SimpleDateFormat monthFormat = new SimpleDateFormat("yyyy-MM");
        Map<String, List<Order>> grouped = new TreeMap<>();
        for (Order o : tutorOrders) {
            Date paidDate = o.getPaidAt();
            if (paidDate == null) continue;
            if (finalFrom != null && paidDate.before(finalFrom)) continue;
            if (finalTo != null && paidDate.after(finalTo)) continue;
            String key = monthFormat.format(paidDate);
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(o);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Order>> entry : grouped.entrySet()) {
            List<Order> orders = entry.getValue();
            double amount = orders.stream().mapToDouble(Order::getAmount).sum();
            double platformFee = orders.stream().mapToDouble(o -> o.getPlatformFee() != null ? o.getPlatformFee() : 0.0).sum();
            double tutorEarning = orders.stream().mapToDouble(o -> o.getTutorEarning() != null ? o.getTutorEarning() : 0.0).sum();
            int count = orders.size();

            Map<String, Object> item = new HashMap<>();
            item.put("month", entry.getKey());
            item.put("totalAmount", amount);
            item.put("platformFee", platformFee);
            item.put("tutorEarning", tutorEarning);
            item.put("orderCount", count);
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/orders/{orderId}")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer orderId) {
        Long userId = getUserId(authHeader);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy hóa đơn"));

        if (order.getStudentId() != userId.intValue() &&
                !order.getTutorClass().getTutorId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền xem hóa đơn này");
        }

        TutorClass classEntity = order.getTutorClass();

        // Tutor info
        User tutor = userRep.findById(classEntity.getTutorId().intValue()).orElse(null);
        String tutorName = tutor != null ? tutor.getFullName() : null;
        String tutorEmail = tutor != null ? tutor.getEmail() : null;
        String tutorPhone = tutor != null ? tutor.getPhone() : null;
        String tutorAvatar = tutor != null ? tutor.getAvatar() : null;

        // Student info
        User student = userRep.findById(order.getStudentId()).orElse(null);
        String studentName = student != null ? student.getFullName() : null;
        String studentEmail = student != null ? student.getEmail() : null;
        String studentPhone = student != null ? student.getPhone() : null;
        String studentAvatar = student != null ? student.getAvatar() : null;

        // Payment info (first payment record)
        String paymentProvider = null;
        String paymentStatus = null;
        String transactionId = null;
        if (order.getPayments() != null && !order.getPayments().isEmpty()) {
            Payment payment = order.getPayments().get(0);
            paymentProvider = payment.getProvider() != null ? payment.getProvider().name() : null;
            paymentStatus = payment.getStatus() != null ? payment.getStatus().name() : null;
            transactionId = payment.getTransactionId();
        }

        // Enrollment for this student+class
        List<OrderDetailResponse.EnrollmentBrief> enrollmentBriefs = new ArrayList<>();
        enrollmentRepository.findByClassEntityIdAndStudentId(classEntity.getId(), order.getStudentId().longValue())
                .ifPresent(e -> enrollmentBriefs.add(OrderDetailResponse.EnrollmentBrief.builder()
                        .id(e.getId())
                        .status(e.getStatus().name())
                        .approvedAt(e.getApprovedAt() != null ? java.sql.Timestamp.valueOf(e.getApprovedAt()) : null)
                        .paidAt(e.getPaidAt() != null ? java.sql.Timestamp.valueOf(e.getPaidAt()) : null)
                        .build()));

        OrderDetailResponse response = OrderDetailResponse.builder()
                .id(order.getId())
                .amount(order.getAmount())
                .commissionRate(order.getCommissionRate())
                .platformFee(order.getPlatformFee())
                .tutorEarning(order.getTutorEarning())
                .tutorPayoutStatus(order.getTutorPayoutStatus() != null ? order.getTutorPayoutStatus().name() : null)
                .tutorPayoutAt(order.getTutorPayoutAt())
                .status(order.getStatus().name())
                .dateCreate(order.getDateCreate())
                .dateUpdate(order.getDateUpdate())
                .paidAt(order.getPaidAt())
                .classId(classEntity.getId())
                .className(classEntity.getTitle())
                .classDescription(classEntity.getDescription())
                .tutorName(tutorName)
                .tutorEmail(tutorEmail)
                .tutorPhone(tutorPhone)
                .tutorAvatar(tutorAvatar)
                .studentId(order.getStudentId())
                .studentName(studentName)
                .studentEmail(studentEmail)
                .studentPhone(studentPhone)
                .studentAvatar(studentAvatar)
                .vnpTxnRef(order.getVnpTxnRef())
                .vnpTransactionNo(order.getVnpTransactionNo())
                .vnpResponseCode(order.getVnpResponseCode())
                .paymentUrl(order.getPaymentUrl())
                .paymentProvider(paymentProvider)
                .paymentStatus(paymentStatus)
                .transactionId(transactionId)
                .enrollments(enrollmentBriefs)
                .build();

        return ResponseEntity.ok(response);
    }
}