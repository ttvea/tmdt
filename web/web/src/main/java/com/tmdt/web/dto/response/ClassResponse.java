package com.tmdt.web.dto.response;


import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.TeachingMode;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ClassResponse {
    private Long id;
    private Long tutorId;
    private String tutorName;
    private String title;
    private String description;
    private Integer categoryId;
    private String categoryName;
    private Long subjectId;
    private String subjectName;
    private Long gradeLevelId;
    private String gradeLevelName;
    private TeachingMode teachingMode;
    private BigDecimal pricePerCourse;
    private Integer totalSessions;
    private Integer maxStudents;
    private Integer currentStudents;
    private ApprovalStatus approvalStatus;
    private String rejectReason;
    private ClassStatus status;
    private String address;
    private String city;
    private String thumbnailUrl;
    private List<ScheduleResponse> schedules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
