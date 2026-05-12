package com.tmdt.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phone;
    private String gender;
    private Integer birthday;
    private String avatar;
}
