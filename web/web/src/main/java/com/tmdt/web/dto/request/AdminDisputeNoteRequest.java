package com.tmdt.web.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminDisputeNoteRequest(
        @NotBlank(message = "Vui lòng nhập ghi chú")
        String note
) {
}
