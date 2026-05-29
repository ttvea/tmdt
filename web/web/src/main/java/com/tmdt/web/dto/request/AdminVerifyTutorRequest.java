package com.tmdt.web.dto.request;

import jakarta.validation.constraints.NotNull;

public record AdminVerifyTutorRequest(
        @NotNull(message = "Trạng thái duyệt không được để trống")
        Boolean verified
) {
}
