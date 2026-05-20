package com.tmdt.web.service;

import com.tmdt.web.dto.response.UserProfileResponse;
import com.tmdt.web.dto.request.UserUpdateRequest;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public void updateUserProfile(Integer userId, UserUpdateRequest request) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setBirthday(request.getBirthday());

        if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
            try {
                user.setGender(User.Gender.valueOf(request.getGender().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Giới tính không hợp lệ!");
            }
        } else {
            user.setGender(null);
        }

        userRep.save(user);
    }
}