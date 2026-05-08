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

import java.security.AuthProvider;
import java.time.LocalDateTime;
import java.util.HashMap;
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
        response.put("user", user);

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


        user.setRole(User.RoleAcc.valueOf(role.toLowerCase()));
        user.setProvider(User.Provider.LOCAL);
        userRep.save(user);

        String token = jwtService.generateToken(user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đăng ký thành công");
        response.put("token", token);
        response.put("user", user);

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
}