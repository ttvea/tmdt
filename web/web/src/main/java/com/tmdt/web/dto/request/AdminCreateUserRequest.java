package com.tmdt.web.dto.request;

import com.tmdt.web.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminCreateUserRequest(
        @NotBlank(message = "Họ tên không được để trống")
        String fullName,

        @Email(message = "Email không hợp lệ")
        @NotBlank(message = "Email không được để trống")
        String email,

        @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
        @NotBlank(message = "Mật khẩu không được để trống")
        String password,

        @NotNull(message = "Vai trò không được để trống")
        User.RoleAcc role,

        Boolean enabled,

        String phone,

        String avatar,

        Boolean sendWelcomeEmail
) {
}
