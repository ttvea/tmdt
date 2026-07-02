package com.tmdt.web.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RatingResponse {

    private Long id;

    private Integer studentId;

    private String nameStudent;

    private String avatar;

    private Integer tutorId;

    private Long classId;

    private Long enrollmentId;

    private String classTitle;

    private Integer stars;

    private String comment;

    private LocalDateTime createdAt;
}
