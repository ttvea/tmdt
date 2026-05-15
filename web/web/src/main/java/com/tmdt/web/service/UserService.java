package com.tmdt.web.service;

import com.tmdt.web.dto.response.UserProfileResponse;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRep userRep;

    public UserProfileResponse getUserProfile(Integer userId) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getGender() != null ? user.getGender().name() : null,
                user.getBirthday(),
                user.getAvatar()
        );
    }
}