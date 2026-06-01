package com.tmdt.web.dto.request;

import lombok.Data;

@Data
public class CreateRatingRequest {

    private Integer tutorId;

    private Integer stars;

    private String comment;
}