package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "payouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {

    public enum PayoutStatus {
        PENDING,
        COMPLETED,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tutor_id", nullable = false)
    private Integer tutorId;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PayoutStatus status = PayoutStatus.PENDING;

    @Column(name = "note")
    private String note;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "provider_transaction_id")
    private String providerTransactionId;

    @Column(name = "provider_note")
    private String providerNote;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account")
    private String bankAccount;

    @Column(name = "bank_holder")
    private String bankHolder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @Column(name = "completed_at")
    private Date completedAt;

    @PrePersist
    public void prePersist() {
        createdAt = new Date();
        if (status == null) {
            status = PayoutStatus.PENDING;
        }
    }
}
