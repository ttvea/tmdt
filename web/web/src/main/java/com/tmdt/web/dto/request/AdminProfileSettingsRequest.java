package com.tmdt.web.dto.request;

public record AdminProfileSettingsRequest(
        String fullName,
        String email,
        String phone,
        String avatar,
        String currentPassword,
        String newPassword
) {
}
