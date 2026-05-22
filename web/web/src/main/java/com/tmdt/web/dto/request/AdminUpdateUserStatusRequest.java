package com.tmdt.web.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminUpdateUserStatusRequest {
    @NotNull
    private Boolean enabled;
}
