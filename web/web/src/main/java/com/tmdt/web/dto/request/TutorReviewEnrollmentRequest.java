package com.tmdt.web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TutorReviewEnrollmentRequest {

    @NotNull
    private Boolean approved;
    private String note;
}
