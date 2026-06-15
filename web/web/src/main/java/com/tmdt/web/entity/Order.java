package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    public enum OrderStatus {
        PENDING,
        PAID,
        CANCELLED,
        EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // học viên
    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    // lớp học
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private TutorClass tutorClass;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "date_create", nullable = false, updatable = false)
    private Date dateCreate;

    @Column(name = "date_update")
    private Date dateUpdate;

    @Column(name = "paid_at")
    private Date paidAt;

    @Column(name = "vnp_txn_ref")
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no")
    private String vnpTransactionNo;

    @Column(name = "vnp_response_code")
    private String vnpResponseCode;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        Date now = new Date();

        if (status == null) {
            status = OrderStatus.PENDING;
        }

        dateCreate = now;
        dateUpdate = now;
    }

    @PreUpdate
    public void preUpdate() {
        dateUpdate = new Date();
    }
}
