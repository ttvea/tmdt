package com.tmdt.web.dto.response;

import com.tmdt.web.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {

    private Long id;
    private Long studentRequestId;
    private Integer tutorId;
    private Integer studentUserId;
    private String studentName;
    private String studentAvatar;

    private String tutorName;

    private String tutorAvatar;

    private String introduction;

    private ApplicationStatus status;

    private LocalDateTime createdAt;
}
