package com.tmdt.web.entity;
import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@Entity
@Table(name = "payments")
@Data
public class Payment {
    public enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED
    }
    public enum PaymentProvider {
        VNPAY,
        MOMO,
        STRIPE
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @Enumerated(EnumType.STRING)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String transactionId;

    private Date paidAt;
}
