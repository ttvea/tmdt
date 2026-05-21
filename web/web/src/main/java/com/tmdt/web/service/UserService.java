package com.tmdt.web.service;

import com.tmdt.web.dto.response.UserProfileResponse;
import com.tmdt.web.dto.request.UserUpdateRequest;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@Service
public class UserService {
    @Autowired
    private UserRep userRep;

    @Autowired
    private Cloudinary cloudinary;

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

    // Hàm cập nhật thông tin
    @Transactional
    public void updateUserProfile(Integer userId, UserUpdateRequest request) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }
        if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
            try {
                user.setGender(User.Gender.valueOf(request.getGender().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Giới tính không hợp lệ!");
            }
        }
        userRep.save(user);
    }

    // HÀm cập nhật avartar
    @Transactional
    public String uploadAvatar(Integer userId, MultipartFile file) {
        try {
            User user = userRep.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            String imageUrl = uploadResult.get("url").toString();
            user.setAvatar(imageUrl);
            userRep.save(user);
            return imageUrl;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi upload ảnh lên Cloudinary: " + e.getMessage());
        }
    }
}