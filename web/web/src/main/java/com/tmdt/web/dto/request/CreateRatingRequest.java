package com.tmdt.web.dto.request;

import lombok.Data;

@Data
public class CreateRatingRequest {

    private Integer tutorId;

    private Long classId;

    private Long enrollmentId;

    private Integer stars;

    private String comment;
}
