package com.tmdt.web.controller;

import com.tmdt.web.dto.response.UserProfileResponse;
import com.tmdt.web.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.tmdt.web.dto.request.UserUpdateRequest;

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
}