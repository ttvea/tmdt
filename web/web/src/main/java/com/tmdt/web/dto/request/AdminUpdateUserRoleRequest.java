package com.tmdt.web.dto.request;

import com.tmdt.web.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminUpdateUserRoleRequest {
    @NotNull
    private User.RoleAcc role;
}
