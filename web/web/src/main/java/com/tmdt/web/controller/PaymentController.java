package com.tmdt.web.controller;

import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.Payment;
import com.tmdt.web.entity.Enrollment;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.PaymentRep;
import com.tmdt.web.service.PaymentService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final OrderRep orderRepository;
    private final PaymentService paymentService;
    private final EnrollmentRep enrollmentRepository;
    private final PaymentRep paymentRepository;
    private final ClassRep classRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/create")
    public Map<String, String> createPayment(
            @RequestParam Integer orderId
    ) throws Exception {

        Order order = orderRepository.findById(orderId)
                .orElseThrow();

        String paymentUrl = paymentService.createVNPayUrl(
                order.getId(),
                order.getAmount()
        );

        order.setVnpTxnRef(String.valueOf(order.getId()));
        order.setPaymentUrl(paymentUrl);
        orderRepository.save(order);

        return Map.of(
                "paymentUrl",
                paymentUrl
        );
    }

    @GetMapping("/vnpay-return")
    @Transactional
    public void paymentReturn(
            @RequestParam String vnp_ResponseCode,
            @RequestParam String vnp_TxnRef,
            @RequestParam(required = false) String vnp_TransactionNo,
            HttpServletResponse response
    ) throws Exception {

        Order order = orderRepository.findById(
                Integer.parseInt(vnp_TxnRef)
        ).orElseThrow();

        order.setVnpTxnRef(vnp_TxnRef);
        order.setVnpResponseCode(vnp_ResponseCode);
        order.setVnpTransactionNo(vnp_TransactionNo);
        boolean alreadyPaid = order.getStatus() == Order.OrderStatus.PAID;

        if (vnp_ResponseCode.equals("00")) {
            // Update Order
            paymentService.applyRevenueSplit(order);
            order.setStatus(Order.OrderStatus.PAID);
            if (order.getPaidAt() == null) {
                order.setPaidAt(new Date());
            }
            orderRepository.save(order);

            // Update Enrollment -> PAID
            if (!alreadyPaid) {
                enrollmentRepository.findByClassEntityIdAndStudentId(
                        order.getTutorClass().getId(),
                        order.getStudentId().longValue()
                ).ifPresent(enrollment -> {
                    enrollment.setStatus(EnrollmentStatus.PAID);
                    if (enrollment.getPaidAt() == null) {
                        enrollment.setPaidAt(LocalDateTime.now());
                    }
                    enrollmentRepository.save(enrollment);

                    // Update class currentStudents
                    TutorClass classEntity = enrollment.getClassEntity();
                    classEntity.setCurrentStudents(classEntity.getCurrentStudents() + 1);
                    long paidCount = enrollmentRepository.countByClassEntityIdAndStatusIn(
                            classEntity.getId(), java.util.List.of(EnrollmentStatus.PAID));
                    if (paidCount >= classEntity.getMaxStudents()) {
                        classEntity.setStatus(ClassStatus.CLOSED);
                    }
                    classRepository.save(classEntity);
                });

                // Create Payment record
                Payment payment = new Payment();
                payment.setOrder(order);
                payment.setProvider(Payment.PaymentProvider.VNPAY);
                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                payment.setTransactionId(vnp_TransactionNo);
                payment.setPaidAt(new Date());
                paymentRepository.save(payment);
            }
        } else {
            // Payment failed
            if (!alreadyPaid) {
                order.setStatus(Order.OrderStatus.CANCELLED);
                order.setTutorPayoutStatus(Order.TutorPayoutStatus.CANCELLED);
            }
            orderRepository.save(order);
        }

        // Redirect về frontend trang danh sách enrollment
        response.sendRedirect(frontendUrl + "/student/enrollments");
    }
}
