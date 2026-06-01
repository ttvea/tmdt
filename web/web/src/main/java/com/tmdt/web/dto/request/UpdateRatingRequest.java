package com.tmdt.web.dto.request;

import lombok.Data;

@Data
public class UpdateRatingRequest {

    private Integer stars;

    private String comment;
}
