package com.tmdt.web.dto.response;

import com.tmdt.web.entity.User;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Integer id,
        String fullName,
        String email,
        String phone,
        String avatar,
        String role,
        Boolean enabled,
        Boolean verified,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getEnabled(),
                user.getVerified(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
