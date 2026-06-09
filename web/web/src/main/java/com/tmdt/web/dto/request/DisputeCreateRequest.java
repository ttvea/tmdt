package com.tmdt.web.dto.request;

import com.tmdt.web.enums.DisputePriority;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record DisputeCreateRequest(
        Integer classId,
        Integer respondentId,
        @NotBlank(message = "Vui lòng nhập lý do tranh chấp")
        String reason,
        @NotBlank(message = "Vui lòng nhập mô tả tranh chấp")
        String description,
        BigDecimal amount,
        DisputePriority priority
) {
}
