package com.tmdt.web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminReviewClassRequest {

    @NotNull
    private Boolean approved;

    private String rejectReason;
}
