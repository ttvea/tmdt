package com.tmdt.web.controller;

import com.tmdt.web.dto.request.ChangePasswordRequest;
import com.tmdt.web.dto.response.UserProfileResponse;
import com.tmdt.web.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.tmdt.web.dto.request.UserUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Integer id) {
        UserProfileResponse profile = userService.getUserProfile(id);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateProfile(@PathVariable Integer id, @RequestBody UserUpdateRequest request) {
        userService.updateUserProfile(id, request);
        return ResponseEntity.ok("Cập nhật thông tin thành công!");
    }

    // Đổi mật khẩu
    @PutMapping("/{id}/change-password")
    public ResponseEntity<String> changePassword(@PathVariable Integer id, @RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(id, request);
            return ResponseEntity.ok("Đổi mật khẩu thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Nhận ảnh đại diện
    @PostMapping("/{id}/avatar")
    public ResponseEntity<String> uploadAvatar(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file) {
        try {
            String newAvatarUrl = userService.uploadAvatar(id, file);
            return ResponseEntity.ok(newAvatarUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi upload: " + e.getMessage());
        }
    }
}
