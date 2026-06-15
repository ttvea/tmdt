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

        order.setStatus(Order.OrderStatus.PENDING);
        order.setVnpTxnRef(String.valueOf(order.getId()));
        order.setPaymentUrl(paymentUrl);
        orderRepository.save(order);

        return Map.of(
                "paymentUrl",
                paymentUrl
        );
    }

    @GetMapping("/vnpay-return")
    public String paymentReturn(
            @RequestParam String vnp_ResponseCode,
            @RequestParam String vnp_TxnRef,
            @RequestParam(required = false) String vnp_TransactionNo
    ) {

        Order order = orderRepository.findById(
                Integer.parseInt(vnp_TxnRef)
        ).orElseThrow();

        order.setVnpTxnRef(vnp_TxnRef);
        order.setVnpResponseCode(vnp_ResponseCode);
        order.setVnpTransactionNo(vnp_TransactionNo);

        if (vnp_ResponseCode.equals("00")) {

            order.setStatus(Order.OrderStatus.PAID);
            order.setPaidAt(new Date());

            orderRepository.save(order);

            return "Thanh toán thành công";
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);

        return "Thanh toán thất bại";
    }
}
