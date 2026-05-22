package com.tmdt.web.controller;

import com.tmdt.web.entity.PasswordResetToken;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.PasswordResetTokenRep;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.EmailService;
import com.tmdt.web.service.JwtService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserRep userRep;
    private final EmailService emailService;
    private final PasswordResetTokenRep tokenRepo;


    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestParam String email,
            @RequestParam String password
    ) {
        User user = userRep.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Email không tồn tại");
        }

        if (Boolean.FALSE.equals(user.getEnabled())) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Tài khoản này đang đăng nhập bằng " +
                            (user.getProvider() != null ? user.getProvider().name() : "OAuth2"));
        }

        boolean checkPassword =
                passwordEncoder.matches(password, user.getPassword());

        if (!checkPassword) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Sai mật khẩu");
        }

        String token = jwtService.generateToken(user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", toAuthUser(user));

        return ResponseEntity.ok(response);
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String username,
            @RequestParam String role
    ) {
        if (userRep.existsByEmail(email)) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Email đã được sử dụng");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(username);


        user.setRole(parseRole(role));
        user.setProvider(User.Provider.LOCAL);
        userRep.save(user);

        String token = jwtService.generateToken(user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đăng ký thành công");
        response.put("token", token);
        response.put("user", toAuthUser(user));

        return ResponseEntity.ok(response);
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {

        Optional<User> userOpt = userRep.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            String token = UUID.randomUUID().toString();

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(token);
            resetToken.setUser(user);
            resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(10));
            resetToken.setUsed(false);

            tokenRepo.save(resetToken);

            emailService.sendResetPassword(email, token);
        }

        return ResponseEntity.ok("Nếu email tồn tại, link reset đã được gửi");
    }


    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword
    ) {

        PasswordResetToken resetToken = tokenRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token đã hết hạn");
        }

        if (resetToken.isUsed()) {
            return ResponseEntity.badRequest().body("Token đã được sử dụng");
        }
        System.out.println(resetToken);
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));

        resetToken.setUsed(true);

        userRep.save(user);
        tokenRepo.save(resetToken);

        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok("Đăng xuất thành công");
    }

    private User.RoleAcc parseRole(String role) {
        if (role == null || role.isBlank()) {
            return User.RoleAcc.STUDENT;
        }

        return User.RoleAcc.valueOf(role.trim().toUpperCase(Locale.ROOT));
    }

    private Map<String, Object> toAuthUser(User user) {
        Map<String, Object> authUser = new HashMap<>();
        authUser.put("id", user.getId());
        authUser.put("email", user.getEmail());
        authUser.put("fullName", user.getFullName());
        authUser.put("phone", user.getPhone());
        authUser.put("avatar", user.getAvatar());
        authUser.put("birthday", user.getBirthday());
        authUser.put("gender", user.getGender() != null ? user.getGender().name() : null);
        authUser.put("role", user.getRole() != null ? user.getRole().name() : null);
        authUser.put("provider", user.getProvider() != null ? user.getProvider().name() : null);
        authUser.put("enabled", user.getEnabled());
        authUser.put("verified", user.getVerified());
        return authUser;
    }
}
