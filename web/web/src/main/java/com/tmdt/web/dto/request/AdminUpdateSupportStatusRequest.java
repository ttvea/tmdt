package com.tmdt.web.dto.request;

import com.tmdt.web.enums.SupportStatus;
import jakarta.validation.constraints.NotNull;

public record AdminUpdateSupportStatusRequest(
        @NotNull(message = "Vui lòng chọn trạng thái")
        SupportStatus status
) {
}
