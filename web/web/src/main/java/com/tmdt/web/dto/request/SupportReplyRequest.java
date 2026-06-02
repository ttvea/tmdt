package com.tmdt.web.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SupportReplyRequest(
        @NotBlank(message = "Vui lòng nhập nội dung phản hồi")
        String message
) {
}
