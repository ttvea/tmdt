package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    public enum RefundReason {
        QUALITY,            // Chất lượng không đảm bảo
        TUTOR_CANCEL,       // Gia sư hủy lớp
        STUDENT_CANCEL,     // Học viên hủy
        NO_SHOW,            // Gia sư không dạy
        OTHER               // Khác
    }

    public enum RefundStatus {
        PENDING_REFUND,     // Chờ tutor thanh toán tiền hoàn
        TUTOR_PAID,         // Tutor đã thanh toán xong, chờ admin xác nhận
        COMPLETED           // Admin xác nhận hoàn tiền cho học viên xong
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "tutor_id", nullable = false)
    private Integer tutorId;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "dispute_id")
    private Integer disputeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefundReason reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RefundStatus status = RefundStatus.PENDING_REFUND;

    // VNPAY thông tin thanh toán từ tutor
    @Column(name = "vnp_txn_ref")
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no")
    private String vnpTransactionNo;

    @Column(name = "vnp_response_code")
    private String vnpResponseCode;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "tutor_paid_at")
    private Date tutorPaidAt;

    @Column(name = "completed_at")
    private Date completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    public void prePersist() {
        Date now = new Date();
        if (status == null) {
            status = RefundStatus.PENDING_REFUND;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = new Date();
    }
}