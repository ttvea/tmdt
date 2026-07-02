package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "platform_fee_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformFeePayment {

    public enum FeePaymentStatus {
        PENDING,
        PAID,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tutor_id", nullable = false)
    private Integer tutorId;

    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private FeePaymentStatus status = FeePaymentStatus.PENDING;

    @Column(name = "vnp_txn_ref")
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no")
    private String vnpTransactionNo;

    @Column(name = "vnp_response_code")
    private String vnpResponseCode;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "paid_at")
    private Date paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = new Date();
        if (status == null) {
            status = FeePaymentStatus.PENDING;
        }
    }
}