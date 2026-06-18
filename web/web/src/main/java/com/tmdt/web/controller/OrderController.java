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

import java.util.*;
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