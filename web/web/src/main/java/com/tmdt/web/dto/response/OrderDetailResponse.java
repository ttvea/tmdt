package com.tmdt.web.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@Builder
public class OrderDetailResponse {
    private Integer id;
    private Double amount;
    private String status;
    private Date dateCreate;
    private Date dateUpdate;
    private Date paidAt;

    // Lớp học
    private Long classId;
    private String className;
    private String classDescription;
    private String tutorName;
    private String tutorEmail;
    private String tutorPhone;
    private String tutorAvatar;

    // Học viên
    private Integer studentId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String studentAvatar;

    // VNPAY
    private String vnpTxnRef;
    private String vnpTransactionNo;
    private String vnpResponseCode;
    private String paymentUrl;

    // Thanh toán
    private String paymentProvider;
    private String paymentStatus;
    private String transactionId;

    // Enrollments
    private List<EnrollmentBrief> enrollments;

    @Data
    @Builder
    public static class EnrollmentBrief {
        private Long id;
        private String status;
        private Date approvedAt;
        private Date paidAt;
    }
}