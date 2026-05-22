package com.tmdt.web.controller;

import com.tmdt.web.dto.response.AdminDashboardResponse;
import com.tmdt.web.entity.User;
import com.tmdt.web.entity.Order;
import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.TutorProfileRep;
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
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final JwtService jwtService;
    private final UserRep userRep;
    private final TutorProfileRep tutorProfileRep;
    private final ClassRep classRep;
    private final EnrollmentRep enrollmentRep;
    private final OrderRep orderRep;

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

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(HttpServletRequest request) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        long totalUsers = userRep.count();
        long newUsersThisWeek = userRep.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));
        long totalTutors = userRep.countByRole(User.RoleAcc.TUTOR);
        long verifiedTutors = tutorProfileRep.countByVerifiedStatus(true);

        long pendingClasses = classRep.countByApprovalStatus(ApprovalStatus.PENDING);
        long totalClasses = classRep.count();
        long openClasses = classRep.countByApprovalStatusAndStatus(ApprovalStatus.APPROVED, ClassStatus.OPEN);
        long teachingClasses = classRep.countByApprovalStatusAndStatus(ApprovalStatus.APPROVED, ClassStatus.CLOSED);
        long completedClasses = classRep.countByApprovalStatusAndStatus(ApprovalStatus.APPROVED, ClassStatus.COMPLETED);

        long totalEnrollments = enrollmentRep.count();
        long pendingEnrollments = enrollmentRep.countByStatus(EnrollmentStatus.PENDING);
        long paidEnrollments = enrollmentRep.countByStatus(EnrollmentStatus.PAID);

        Double revenue = orderRep.sumAmountByStatus(Order.OrderStatus.PAID.name());

        return ResponseEntity.ok(new AdminDashboardResponse(
                revenue != null ? revenue : 0,
                totalUsers,
                newUsersThisWeek,
                totalTutors,
                verifiedTutors,
                pendingClasses,
                totalClasses,
                openClasses,
                teachingClasses,
                completedClasses,
                totalEnrollments,
                pendingEnrollments,
                paidEnrollments
        ));
    }

    private ResponseEntity<?> validateAdminRequest(HttpServletRequest request) {
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

        return null;
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }
}
