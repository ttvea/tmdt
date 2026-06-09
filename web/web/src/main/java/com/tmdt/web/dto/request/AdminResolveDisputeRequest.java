package com.tmdt.web.dto.request;

import com.tmdt.web.enums.DisputeResolutionType;
import com.tmdt.web.enums.DisputeStatus;
import jakarta.validation.constraints.NotNull;

public record AdminResolveDisputeRequest(
        @NotNull(message = "Vui lòng chọn trạng thái")
        DisputeStatus status,
        DisputeResolutionType resolutionType,
        String resolutionNote
) {
}
