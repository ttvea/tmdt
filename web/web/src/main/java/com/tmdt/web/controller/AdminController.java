package com.tmdt.web.controller;

import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final JwtService jwtService;
    private final UserRep userRep;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentAdmin(HttpServletRequest request) {
        String token = extractBearerToken(request);

        if (token == null || !jwtService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token không hợp lệ");
        }

        String email = jwtService.extractUsername(token);
        User user = userRep.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không tìm thấy người dùng");
        }

        if (user.getRole() != User.RoleAcc.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ tài khoản admin mới được truy cập");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRole().name());
        response.put("avatar", user.getAvatar());
        return ResponseEntity.ok(response);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }
}

