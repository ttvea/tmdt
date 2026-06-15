package com.tmdt.web.dto.response;

import com.tmdt.web.enums.EnrollmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EnrollmentResponse {
    private Long id;
    private Long classId;
    private String classTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String studentAvatar;
    private EnrollmentStatus status;
    private String note;
    private LocalDateTime approvedAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private Integer orderId;          // <-- THÊM: orderId để FE dùng
    private Long amount;              // <-- THÊM: số tiền của order
}