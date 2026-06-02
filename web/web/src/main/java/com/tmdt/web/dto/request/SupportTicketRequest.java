package com.tmdt.web.dto.request;

import com.tmdt.web.enums.SupportCategory;
import com.tmdt.web.enums.SupportPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportTicketRequest(
        @NotBlank(message = "Vui lòng nhập tiêu đề hỗ trợ")
        @Size(max = 180, message = "Tiêu đề không được vượt quá 180 ký tự")
        String subject,

        SupportCategory category,

        SupportPriority priority,

        @NotBlank(message = "Vui lòng nhập nội dung hỗ trợ")
        String message
) {
}
