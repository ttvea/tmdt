package com.tmdt.web.controller;

import com.tmdt.web.dto.response.AdminDashboardResponse;
import com.tmdt.web.dto.request.AdminCreateUserRequest;
import com.tmdt.web.dto.request.AdminUpdateUserRoleRequest;
import com.tmdt.web.dto.request.AdminUpdateUserStatusRequest;
import com.tmdt.web.dto.request.AdminAssignSupportTicketRequest;
import com.tmdt.web.dto.request.AdminUpdateSupportStatusRequest;
import com.tmdt.web.dto.request.AdminVerifyTutorRequest;
import com.tmdt.web.dto.request.SupportReplyRequest;
import com.tmdt.web.dto.request.VoucherRequest;
import com.tmdt.web.dto.response.AdminTutorResponse;
import com.tmdt.web.dto.response.AdminUserResponse;
import com.tmdt.web.dto.response.AdminUsersStatsResponse;
import com.tmdt.web.dto.response.VoucherResponse;
import com.tmdt.web.entity.User;
import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.enums.SupportCategory;
import com.tmdt.web.enums.SupportPriority;
import com.tmdt.web.enums.SupportStatus;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.TutorProfileRep;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.SupportService;
import com.tmdt.web.service.VoucherService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    private final PasswordEncoder passwordEncoder;
    private final VoucherService voucherService;
    private final SupportService supportService;

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

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            HttpServletRequest request,
            @RequestParam(required = false) User.RoleAcc role,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String normalizedKeyword = keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null;

        Page<AdminUserResponse> users = userRep
                .searchAdminUsers(role, enabled, normalizedKeyword, pageable)
                .map(AdminUserResponse::from);

        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/stats")
    public ResponseEntity<?> getUsersStats(HttpServletRequest request) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(new AdminUsersStatsResponse(
                userRep.count(),
                userRep.countByRole(User.RoleAcc.STUDENT),
                userRep.countByRole(User.RoleAcc.TUTOR),
                userRep.countByRole(User.RoleAcc.ADMIN),
                userRep.countByEnabled(true),
                userRep.countByEnabled(false),
                userRep.countByCreatedAtAfter(LocalDateTime.now().minusDays(7))
        ));
    }

    @GetMapping("/tutors")
    public ResponseEntity<?> getTutors(
            HttpServletRequest request,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String normalizedKeyword = keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null;

        Page<AdminTutorResponse> tutors = userRep
                .searchAdminUsers(User.RoleAcc.TUTOR, null, normalizedKeyword, pageable)
                .map(user -> AdminTutorResponse.from(
                        user,
                        tutorProfileRep.findByUserId(user.getId()).orElse(null)
                ));

        return ResponseEntity.ok(tutors);
    }

    @PatchMapping("/tutors/{userId}/verification")
    public ResponseEntity<?> updateTutorVerification(
            HttpServletRequest request,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminVerifyTutorRequest verifyRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        User user = userRep.findById(userId).orElse(null);
        if (user == null || user.getRole() != User.RoleAcc.TUTOR) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy tài khoản gia sư");
        }

        TutorProfile profile = tutorProfileRep.findByUserId(userId).orElse(null);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Gia sư chưa upload hồ sơ");
        }

        profile.setIsVerified(verifyRequest.verified());
        user.setVerified(verifyRequest.verified());

        tutorProfileRep.save(profile);
        userRep.save(user);

        return ResponseEntity.ok(AdminTutorResponse.from(user, profile));
    }

    @GetMapping("/vouchers")
    public ResponseEntity<?> getPlatformVouchers(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(voucherService.getPlatformVouchers(pageable));
    }

    @PostMapping("/vouchers")
    public ResponseEntity<?> createPlatformVoucher(
            HttpServletRequest request,
            @Valid @RequestBody VoucherRequest voucherRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(voucherService.createPlatformVoucher(voucherRequest));
    }

    @PutMapping("/vouchers/{voucherId}")
    public ResponseEntity<?> updatePlatformVoucher(
            HttpServletRequest request,
            @PathVariable Long voucherId,
            @Valid @RequestBody VoucherRequest voucherRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(voucherService.updatePlatformVoucher(voucherId, voucherRequest));
    }

    @PatchMapping("/vouchers/{voucherId}/status")
    public ResponseEntity<?> updatePlatformVoucherStatus(
            HttpServletRequest request,
            @PathVariable Long voucherId,
            @RequestParam boolean active
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(voucherService.updatePlatformVoucherStatus(voucherId, active));
    }

    @GetMapping("/support/stats")
    public ResponseEntity<?> getSupportStats(HttpServletRequest request) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(supportService.getAdminStats());
    }

    @GetMapping("/support/tickets")
    public ResponseEntity<?> getSupportTickets(
            HttpServletRequest request,
            @RequestParam(required = false) SupportStatus status,
            @RequestParam(required = false) SupportCategory category,
            @RequestParam(required = false) SupportPriority priority,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(supportService.getAdminTickets(status, category, priority, keyword, pageable));
    }

    @GetMapping("/support/tickets/{ticketId}")
    public ResponseEntity<?> getSupportTicketDetail(HttpServletRequest request, @PathVariable Long ticketId) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(supportService.getAdminTicketDetail(ticketId));
    }

    @PatchMapping("/support/tickets/{ticketId}/status")
    public ResponseEntity<?> updateSupportTicketStatus(
            HttpServletRequest request,
            @PathVariable Long ticketId,
            @Valid @RequestBody AdminUpdateSupportStatusRequest statusRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(supportService.updateStatus(ticketId, statusRequest.status()));
    }

    @PatchMapping("/support/tickets/{ticketId}/assign")
    public ResponseEntity<?> assignSupportTicket(
            HttpServletRequest request,
            @PathVariable Long ticketId,
            @RequestBody AdminAssignSupportTicketRequest assignRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(supportService.assignTicket(ticketId, assignRequest.adminId()));
    }

    @PostMapping("/support/tickets/{ticketId}/replies")
    public ResponseEntity<?> replySupportTicket(
            HttpServletRequest request,
            @PathVariable Long ticketId,
            @Valid @RequestBody SupportReplyRequest replyRequest
    ) {
        User admin = getAdminUserFromRequest(request);
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(supportService.addReply(ticketId, admin, replyRequest.message(), true));
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(
            HttpServletRequest request,
            @Valid @RequestBody AdminCreateUserRequest createRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        String email = createRequest.email().trim().toLowerCase();
        if (userRep.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email đã được sử dụng");
        }

        User user = new User();
        user.setFullName(createRequest.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(createRequest.password()));
        user.setRole(createRequest.role());
        user.setProvider(User.Provider.LOCAL);
        user.setEnabled(createRequest.enabled() == null || createRequest.enabled());
        user.setVerified(false);
        user.setPhone(normalizeOptionalText(createRequest.phone()));
        user.setAvatar(normalizeOptionalText(createRequest.avatar()));
        user.setGender(createRequest.gender());
        user.setBirthday(createRequest.birthday());

        User saved = userRep.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(AdminUserResponse.from(saved));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            HttpServletRequest request,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserStatusRequest updateRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        User currentAdmin = getAdminUserFromRequest(request);
        if (currentAdmin != null && currentAdmin.getId().equals(userId) && Boolean.FALSE.equals(updateRequest.getEnabled())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Không thể khóa tài khoản admin hiện tại");
        }

        User user = userRep.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        user.setEnabled(updateRequest.getEnabled());
        User saved = userRep.save(user);

        return ResponseEntity.ok(AdminUserResponse.from(saved));
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(
            HttpServletRequest request,
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRoleRequest updateRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        User user = userRep.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng");
        }

        if (user.getRole() == User.RoleAcc.ADMIN) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Không thể sửa quyền tài khoản admin");
        }

        user.setRole(updateRequest.getRole());
        User saved = userRep.save(user);

        return ResponseEntity.ok(AdminUserResponse.from(saved));
    }

    private ResponseEntity<?> validateAdminRequest(HttpServletRequest request) {
        User user = getAdminUserFromRequest(request);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Không tìm thấy người dùng");
        }

        if (user.getRole() != User.RoleAcc.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ tài khoản admin mới được truy cập");
        }

        return null;
    }

    private User getAdminUserFromRequest(HttpServletRequest request) {
        String token = extractBearerToken(request);

        if (token == null || !jwtService.validateToken(token)) {
            return null;
        }

        String email = jwtService.extractUsername(token);
        return userRep.findByEmail(email).orElse(null);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
