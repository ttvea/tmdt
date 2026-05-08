package com.tmdt.web.controller;

import com.tmdt.web.entity.Order;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final OrderRep orderRepository;
    private final PaymentService paymentService;

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

        return Map.of(
                "paymentUrl",
                paymentUrl
        );
    }

    @GetMapping("/vnpay-return")
    public String paymentReturn(
            @RequestParam String vnp_ResponseCode,
            @RequestParam String vnp_TxnRef
    ) {

        Order order = orderRepository.findById(
                Integer.parseInt(vnp_TxnRef)
        ).orElseThrow();

        if (vnp_ResponseCode.equals("00")) {

            order.setStatus(Order.OrderStatus.PAID);

            orderRepository.save(order);

            return "Thanh toán thành công";
        }

        return "Thanh toán thất bại";
    }
}