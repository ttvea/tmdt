package com.tmdt.web.controller;

import com.tmdt.web.dto.response.AdminDashboardResponse;
import com.tmdt.web.dto.request.AdminCreateUserRequest;
import com.tmdt.web.dto.request.AdminApprovalSettingsRequest;
import com.tmdt.web.dto.request.AdminUpdateUserRoleRequest;
import com.tmdt.web.dto.request.AdminUpdateUserStatusRequest;
import com.tmdt.web.dto.request.AdminAssignSupportTicketRequest;
import com.tmdt.web.dto.request.AdminDisputeNoteRequest;
import com.tmdt.web.dto.request.AdminPlatformSettingsRequest;
import com.tmdt.web.dto.request.AdminProfileSettingsRequest;
import com.tmdt.web.dto.request.AdminResolveDisputeRequest;
import com.tmdt.web.dto.request.AdminSupportDisputeSettingsRequest;
import com.tmdt.web.dto.request.AdminUpdateSupportStatusRequest;
import com.tmdt.web.dto.request.AdminVerifyTutorRequest;
import com.tmdt.web.dto.request.SupportReplyRequest;
import com.tmdt.web.dto.request.VoucherRequest;
import com.tmdt.web.dto.response.AdminTutorResponse;
import com.tmdt.web.dto.response.AdminUserResponse;
import com.tmdt.web.dto.response.AdminUsersStatsResponse;
import com.tmdt.web.dto.response.VoucherResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tmdt.web.entity.User;
import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.SystemSetting;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.enums.DisputePriority;
import com.tmdt.web.enums.DisputeStatus;
import com.tmdt.web.enums.ReportType;
import com.tmdt.web.enums.SupportCategory;
import com.tmdt.web.enums.SupportPriority;
import com.tmdt.web.enums.SupportStatus;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.DisputeRep;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.SystemSettingRep;
import com.tmdt.web.repository.TutorProfileRep;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.DisputeService;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;

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
    private final DisputeRep disputeRep;
    private final SystemSettingRep systemSettingRep;
    private final PasswordEncoder passwordEncoder;
    private final Cloudinary cloudinary;
    private final VoucherService voucherService;
    private final SupportService supportService;
    private final DisputeService disputeService;

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

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings(HttpServletRequest request) {
        User admin = getAdminUserFromRequest(request);
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile", adminProfile(admin));
        response.put("platform", Map.ofEntries(
                Map.entry("siteName", getSetting("platform.siteName", "EduMatch Pro")),
                Map.entry("brandName", getSetting("platform.brandName", "EduMatch Pro")),
                Map.entry("logoUrl", getSetting("platform.logoUrl", "")),
                Map.entry("faviconUrl", getSetting("platform.faviconUrl", "")),
                Map.entry("hotline", getSetting("platform.hotline", "0369 148 660")),
                Map.entry("supportEmail", getSetting("platform.supportEmail", "giasuhome.vn@gmail.com")),
                Map.entry("officeAddress", getSetting("platform.officeAddress", "107A Nguyễn Phong Sắc, Dịch Vọng Hậu, Cầu Giấy, Hà Nội")),
                Map.entry("workingHours", getSetting("platform.workingHours", "Thứ 2 - Chủ nhật: 08:00 - 22:00")),
                Map.entry("zaloUrl", getSetting("platform.zaloUrl", "")),
                Map.entry("messengerUrl", getSetting("platform.messengerUrl", "")),
                Map.entry("facebookUrl", getSetting("platform.facebookUrl", ""))
        ));
        response.put("approval", Map.ofEntries(
                Map.entry("requireTutorVerification", getBooleanSetting("approval.requireTutorVerification", true)),
                Map.entry("tutorMustBeVerifiedToOpenClass", getBooleanSetting("approval.tutorMustBeVerifiedToOpenClass", true)),
                Map.entry("requiredTutorDocuments", getSetting("approval.requiredTutorDocuments", "CCCD, thẻ sinh viên/bằng cấp, chứng chỉ liên quan")),
                Map.entry("tutorApprovedMessage", getSetting("approval.tutorApprovedMessage", "Hồ sơ gia sư của bạn đã được xác thực.")),
                Map.entry("tutorRejectedMessage", getSetting("approval.tutorRejectedMessage", "Hồ sơ chưa đạt yêu cầu. Vui lòng cập nhật thêm thông tin.")),
                Map.entry("requireClassApproval", getBooleanSetting("approval.requireClassApproval", true)),
                Map.entry("maxClassesForUnverifiedTutor", getIntSetting("approval.maxClassesForUnverifiedTutor", 0)),
                Map.entry("autoCloseClassAfterDays", getIntSetting("approval.autoCloseClassAfterDays", 30))
        ));
        response.put("supportDisputes", Map.ofEntries(
                Map.entry("supportSlaHours", getIntSetting("support.slaHours", 24)),
                Map.entry("supportCategories", getSetting("support.categories", "Tài khoản, Hồ sơ gia sư, Xác thực, Lớp học, Thanh toán, Mã giảm giá, Báo cáo, Khác")),
                Map.entry("disputeReasons", getSetting("dispute.reasons", "Chất lượng kém, Không xuất hiện, Thanh toán, Lịch học, Khác")),
                Map.entry("evidenceDeadlineHours", getIntSetting("dispute.evidenceDeadlineHours", 48)),
                Map.entry("defaultRefundPolicy", getSetting("dispute.defaultRefundPolicy", "Admin xem xét từng trường hợp dựa trên bằng chứng và lịch sử lớp học.")),
                Map.entry("needEvidenceMessage", getSetting("dispute.needEvidenceMessage", "Vui lòng bổ sung bằng chứng để admin tiếp tục xử lý tranh chấp.")),
                Map.entry("disputeResolvedMessage", getSetting("dispute.resolvedMessage", "Tranh chấp đã được xử lý. Vui lòng kiểm tra kết quả trong tài khoản của bạn."))
        ));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/settings/profile")
    public ResponseEntity<?> updateProfileSettings(
            HttpServletRequest request,
            @RequestBody AdminProfileSettingsRequest settingsRequest
    ) {
        User admin = getAdminUserFromRequest(request);
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        String email = normalizeOptionalText(settingsRequest.email());
        if (email != null && !email.equalsIgnoreCase(admin.getEmail()) && userRep.existsByEmail(email.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email đã được sử dụng");
        }

        String newPassword = normalizeOptionalText(settingsRequest.newPassword());
        if (newPassword != null) {
            String currentPassword = normalizeOptionalText(settingsRequest.currentPassword());
            if (currentPassword == null || admin.getPassword() == null || !passwordEncoder.matches(currentPassword, admin.getPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mật khẩu hiện tại không đúng");
            }
            if (newPassword.length() < 8) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mật khẩu mới phải có ít nhất 8 ký tự");
            }
            admin.setPassword(passwordEncoder.encode(newPassword));
        }

        String fullName = normalizeOptionalText(settingsRequest.fullName());
        if (fullName != null) {
            admin.setFullName(fullName);
        }
        if (email != null) {
            admin.setEmail(email.toLowerCase());
        }
        admin.setPhone(normalizeOptionalText(settingsRequest.phone()));
        admin.setAvatar(normalizeOptionalText(settingsRequest.avatar()));

        User saved = userRep.save(admin);
        return ResponseEntity.ok(adminProfile(saved));
    }

    @PutMapping("/settings/platform")
    public ResponseEntity<?> updatePlatformSettings(
            HttpServletRequest request,
            @RequestBody AdminPlatformSettingsRequest settingsRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        saveSetting("platform.siteName", settingsRequest.siteName());
        saveSetting("platform.brandName", settingsRequest.brandName());
        saveSetting("platform.logoUrl", settingsRequest.logoUrl());
        saveSetting("platform.faviconUrl", settingsRequest.faviconUrl());
        saveSetting("platform.hotline", settingsRequest.hotline());
        saveSetting("platform.supportEmail", settingsRequest.supportEmail());
        saveSetting("platform.officeAddress", settingsRequest.officeAddress());
        saveSetting("platform.workingHours", settingsRequest.workingHours());
        saveSetting("platform.zaloUrl", settingsRequest.zaloUrl());
        saveSetting("platform.messengerUrl", settingsRequest.messengerUrl());
        saveSetting("platform.facebookUrl", settingsRequest.facebookUrl());
        return getSettings(request);
    }

    @PutMapping("/settings/approval")
    public ResponseEntity<?> updateApprovalSettings(
            HttpServletRequest request,
            @RequestBody AdminApprovalSettingsRequest settingsRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        saveSetting("approval.requireTutorVerification", settingsRequest.requireTutorVerification());
        saveSetting("approval.tutorMustBeVerifiedToOpenClass", settingsRequest.tutorMustBeVerifiedToOpenClass());
        saveSetting("approval.requiredTutorDocuments", settingsRequest.requiredTutorDocuments());
        saveSetting("approval.tutorApprovedMessage", settingsRequest.tutorApprovedMessage());
        saveSetting("approval.tutorRejectedMessage", settingsRequest.tutorRejectedMessage());
        saveSetting("approval.requireClassApproval", settingsRequest.requireClassApproval());
        saveSetting("approval.maxClassesForUnverifiedTutor", settingsRequest.maxClassesForUnverifiedTutor());
        saveSetting("approval.autoCloseClassAfterDays", settingsRequest.autoCloseClassAfterDays());
        return getSettings(request);
    }

    @PutMapping("/settings/support-disputes")
    public ResponseEntity<?> updateSupportDisputeSettings(
            HttpServletRequest request,
            @RequestBody AdminSupportDisputeSettingsRequest settingsRequest
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        saveSetting("support.slaHours", settingsRequest.supportSlaHours());
        saveSetting("support.categories", settingsRequest.supportCategories());
        saveSetting("dispute.reasons", settingsRequest.disputeReasons());
        saveSetting("dispute.evidenceDeadlineHours", settingsRequest.evidenceDeadlineHours());
        saveSetting("dispute.defaultRefundPolicy", settingsRequest.defaultRefundPolicy());
        saveSetting("dispute.needEvidenceMessage", settingsRequest.needEvidenceMessage());
        saveSetting("dispute.resolvedMessage", settingsRequest.disputeResolvedMessage());
        return getSettings(request);
    }

    @PostMapping("/settings/assets")
    public ResponseEntity<?> uploadSettingsAsset(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Vui lòng chọn file ảnh");
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "edumatch/settings")
            );
            return ResponseEntity.ok(uploadResult.get("secure_url").toString());
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Không thể upload ảnh: " + exception.getMessage());
        }
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

        Double grossRevenue = orderRep.sumAmountByStatus(Order.OrderStatus.PAID.name());
        Double platformRevenue = orderRep.sumPlatformFeeByStatus(Order.OrderStatus.PAID.name());

        return ResponseEntity.ok(new AdminDashboardResponse(
                platformRevenue != null ? platformRevenue : 0,
                grossRevenue != null ? grossRevenue : 0,
                platformRevenue != null ? platformRevenue : 0,
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

    @GetMapping("/disputes/stats")
    public ResponseEntity<?> getDisputeStats(HttpServletRequest request) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(disputeService.getAdminStats());
    }

    @GetMapping("/disputes")
    public ResponseEntity<?> getDisputes(
            HttpServletRequest request,
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(required = false) DisputePriority priority,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(disputeService.getAdminDisputes(status, priority, keyword, pageable));
    }

    @GetMapping("/disputes/{disputeId}")
    public ResponseEntity<?> getDisputeDetail(HttpServletRequest request, @PathVariable Long disputeId) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(disputeService.getAdminDisputeDetail(disputeId));
    }

    @PatchMapping("/disputes/{disputeId}/resolve")
    public ResponseEntity<?> resolveDispute(
            HttpServletRequest request,
            @PathVariable Long disputeId,
            @Valid @RequestBody AdminResolveDisputeRequest resolveRequest
    ) {
        User admin = getAdminUserFromRequest(request);
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(disputeService.resolveDispute(
                disputeId,
                admin,
                resolveRequest.status(),
                resolveRequest.resolutionType(),
                resolveRequest.resolutionNote()
        ));
    }

    @PostMapping("/disputes/{disputeId}/notes")
    public ResponseEntity<?> addDisputeNote(
            HttpServletRequest request,
            @PathVariable Long disputeId,
            @Valid @RequestBody AdminDisputeNoteRequest noteRequest
    ) {
        User admin = getAdminUserFromRequest(request);
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        return ResponseEntity.ok(disputeService.addNote(disputeId, admin, noteRequest.note()));
    }

    @GetMapping("/reports/export")
    public ResponseEntity<?> exportReport(
            HttpServletRequest request,
            @RequestParam ReportType type,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "CSV") String format
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        LocalDate startDate = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate endDate = to != null ? to : LocalDate.now();
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay().minusNanos(1);

        String csv = switch (type) {
            case DASHBOARD -> buildDashboardReportCsv(startDate, endDate);
            case DISPUTES -> buildDisputesReportCsv(start, end);
            case USERS -> buildUsersReportCsv(start, end);
            case TUTORS -> buildTutorsReportCsv(start, end);
        };

        if ("PDF".equalsIgnoreCase(format)) {
            String fileName = "edumatch-" + type.name().toLowerCase() + "-" + LocalDate.now() + ".pdf";
            byte[] body = buildReportPdf(type, startDate, endDate, csv);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(body);
        }

        String fileName = "edumatch-" + type.name().toLowerCase() + "-" + LocalDate.now() + ".csv";
        byte[] body = ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }

    @GetMapping("/reports/preview")
    public ResponseEntity<?> previewReport(
            HttpServletRequest request,
            @RequestParam ReportType type,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        ResponseEntity<?> authError = validateAdminRequest(request);
        if (authError != null) {
            return authError;
        }

        LocalDate startDate = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate endDate = to != null ? to : LocalDate.now();
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay().minusNanos(1);

        return ResponseEntity.ok(switch (type) {
            case DASHBOARD -> buildDashboardReportPreview(startDate, endDate, start, end);
            case DISPUTES -> buildDisputesReportPreview(startDate, endDate, start, end);
            case USERS -> buildUsersReportPreview(startDate, endDate, start, end);
            case TUTORS -> buildTutorsReportPreview(startDate, endDate, start, end);
        });
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

    private Map<String, Object> adminProfile(User admin) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", admin.getId());
        profile.put("fullName", admin.getFullName());
        profile.put("email", admin.getEmail());
        profile.put("phone", admin.getPhone());
        profile.put("avatar", admin.getAvatar());
        profile.put("role", admin.getRole() != null ? admin.getRole().name() : null);
        return profile;
    }

    private String getSetting(String key, String defaultValue) {
        return systemSettingRep.findById(key)
                .map(SystemSetting::getValue)
                .filter(value -> value != null && !value.isBlank())
                .orElse(defaultValue);
    }

    private boolean getBooleanSetting(String key, boolean defaultValue) {
        String value = getSetting(key, String.valueOf(defaultValue));
        return Boolean.parseBoolean(value);
    }

    private int getIntSetting(String key, int defaultValue) {
        try {
            return Integer.parseInt(getSetting(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }

    private void saveSetting(String key, Object value) {
        SystemSetting setting = systemSettingRep.findById(key).orElseGet(SystemSetting::new);
        setting.setKey(key);
        setting.setValue(value == null ? "" : String.valueOf(value).trim());
        systemSettingRep.save(setting);
    }

    private String buildDashboardReportCsv(LocalDate from, LocalDate to) {
        Double revenue = orderRep.sumPlatformFeeByStatus(Order.OrderStatus.PAID.name());

        StringBuilder csv = new StringBuilder();
        csv.append("Chỉ số,Giá trị,Từ ngày,Đến ngày\n");
        appendCsvRow(csv, "Tổng doanh thu", revenue != null ? revenue : 0, from, to);
        appendCsvRow(csv, "Tổng người dùng", userRep.count(), from, to);
        appendCsvRow(csv, "Người dùng mới 7 ngày", userRep.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)), from, to);
        appendCsvRow(csv, "Tổng gia sư", userRep.countByRole(User.RoleAcc.TUTOR), from, to);
        appendCsvRow(csv, "Gia sư đã xác thực", tutorProfileRep.countByVerifiedStatus(true), from, to);
        appendCsvRow(csv, "Lớp chờ duyệt", classRep.countByApprovalStatus(ApprovalStatus.PENDING), from, to);
        appendCsvRow(csv, "Tổng lớp học", classRep.count(), from, to);
        appendCsvRow(csv, "Lượt đăng ký học", enrollmentRep.count(), from, to);
        appendCsvRow(csv, "Đăng ký đang chờ", enrollmentRep.countByStatus(EnrollmentStatus.PENDING), from, to);
        appendCsvRow(csv, "Đăng ký đã thanh toán", enrollmentRep.countByStatus(EnrollmentStatus.PAID), from, to);
        return csv.toString();
    }

    private String buildDisputesReportCsv(LocalDateTime from, LocalDateTime to) {
        List<com.tmdt.web.entity.Dispute> disputes = disputeRep.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        StringBuilder csv = new StringBuilder();
        csv.append("Mã case,Học viên,Gia sư,Lớp học,Số tiền,Lý do,Trạng thái,Kết quả,Ngày tạo,Ngày xử lý\n");

        for (com.tmdt.web.entity.Dispute dispute : disputes) {
            appendCsvRow(
                    csv,
                    dispute.getCaseCode(),
                    dispute.getStudent() != null ? dispute.getStudent().getFullName() : "",
                    dispute.getTutor() != null ? dispute.getTutor().getFullName() : "",
                    dispute.getTutorClass() != null ? dispute.getTutorClass().getTitle() : "",
                    dispute.getAmount() != null ? dispute.getAmount() : 0,
                    dispute.getReason(),
                    dispute.getStatus(),
                    dispute.getResolutionType(),
                    dispute.getCreatedAt(),
                    dispute.getResolvedAt() != null ? dispute.getResolvedAt() : ""
            );
        }

        return csv.toString();
    }

    private String buildUsersReportCsv(LocalDateTime from, LocalDateTime to) {
        List<User> users = userRep.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Họ tên,Email,Số điện thoại,Vai trò,Trạng thái,Xác thực,Ngày tạo\n");

        for (User user : users) {
            appendCsvRow(
                    csv,
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getRole(),
                    Boolean.FALSE.equals(user.getEnabled()) ? "Đã khóa" : "Hoạt động",
                    Boolean.TRUE.equals(user.getVerified()) ? "Đã xác thực" : "Chưa xác thực",
                    user.getCreatedAt()
            );
        }

        return csv.toString();
    }

    private String buildTutorsReportCsv(LocalDateTime from, LocalDateTime to) {
        List<User> tutors = userRep.findByRoleAndCreatedAtBetweenOrderByCreatedAtDesc(User.RoleAcc.TUTOR, from, to);
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Họ tên,Email,Số điện thoại,Chuyên ngành,Kinh nghiệm,Hồ sơ,Trạng thái tài khoản,Ngày tạo\n");

        for (User tutor : tutors) {
            TutorProfile profile = tutorProfileRep.findByUserId(tutor.getId()).orElse(null);
            appendCsvRow(
                    csv,
                    tutor.getId(),
                    tutor.getFullName(),
                    tutor.getEmail(),
                    tutor.getPhone(),
                    profile != null ? firstNonBlank(profile.getTeachMajor(), profile.getMajor()) : "",
                    profile != null ? profile.getExperience() : "",
                    profile == null ? "Chưa upload" : Boolean.TRUE.equals(profile.getIsVerified()) ? "Đã duyệt" : "Chờ duyệt",
                    Boolean.FALSE.equals(tutor.getEnabled()) ? "Đã khóa" : "Hoạt động",
                    tutor.getCreatedAt()
            );
        }

        return csv.toString();
    }

    private byte[] buildReportPdf(ReportType type, LocalDate from, LocalDate to, String csv) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            List<List<String>> rows = parseCsv(csv);
            Document document = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            BaseFont baseFont = createPdfBaseFont();
            Font titleFont = new Font(baseFont, 16, Font.BOLD);
            Font metaFont = new Font(baseFont, 10, Font.NORMAL);
            Font headerFont = new Font(baseFont, 9, Font.BOLD);
            Font bodyFont = new Font(baseFont, 8, Font.NORMAL);

            Paragraph title = new Paragraph("EduMatch Pro - " + getReportTitle(type), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(8);
            document.add(title);

            Paragraph meta = new Paragraph("Khoang thoi gian: " + from + " - " + to + " | Ngay tao: " + LocalDate.now(), metaFont);
            meta.setAlignment(Element.ALIGN_CENTER);
            meta.setSpacingAfter(16);
            document.add(meta);

            if (rows.isEmpty()) {
                document.add(new Paragraph("Khong co du lieu bao cao.", bodyFont));
            } else {
                List<String> headers = rows.get(0);
                PdfPTable table = new PdfPTable(headers.size());
                table.setWidthPercentage(100);

                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cell.setPadding(6);
                    cell.setBackgroundColor(new java.awt.Color(232, 240, 254));
                    table.addCell(cell);
                }

                for (int rowIndex = 1; rowIndex < rows.size(); rowIndex++) {
                    List<String> row = rows.get(rowIndex);
                    for (int colIndex = 0; colIndex < headers.size(); colIndex++) {
                        String value = colIndex < row.size() ? row.get(colIndex) : "";
                        PdfPCell cell = new PdfPCell(new Phrase(value, bodyFont));
                        cell.setPadding(5);
                        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                        table.addCell(cell);
                    }
                }

                document.add(table);
            }

            document.close();
            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Khong the tao file PDF bao cao", exception);
        }
    }

    private String getReportTitle(ReportType type) {
        return switch (type) {
            case DASHBOARD -> "Bao cao tong quan";
            case DISPUTES -> "Bao cao tranh chap";
            case USERS -> "Bao cao nguoi dung";
            case TUTORS -> "Bao cao gia su";
        };
    }

    private BaseFont createPdfBaseFont() throws Exception {
        String[] candidates = {
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/Arial.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/dejavu/DejaVuSans.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
        };

        for (String path : candidates) {
            if (new File(path).exists()) {
                return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            }
        }

        return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
    }

    private List<List<String>> parseCsv(String csv) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;

        for (int index = 0; index < csv.length(); index++) {
            char current = csv.charAt(index);
            if (current == '"') {
                if (quoted && index + 1 < csv.length() && csv.charAt(index + 1) == '"') {
                    cell.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (current == ',' && !quoted) {
                row.add(cell.toString());
                cell.setLength(0);
            } else if ((current == '\n' || current == '\r') && !quoted) {
                if (current == '\r' && index + 1 < csv.length() && csv.charAt(index + 1) == '\n') {
                    index++;
                }
                row.add(cell.toString());
                cell.setLength(0);
                if (!row.isEmpty() && row.stream().anyMatch(value -> value != null && !value.isBlank())) {
                    rows.add(row);
                }
                row = new ArrayList<>();
            } else {
                cell.append(current);
            }
        }

        if (cell.length() > 0 || !row.isEmpty()) {
            row.add(cell.toString());
            if (row.stream().anyMatch(value -> value != null && !value.isBlank())) {
                rows.add(row);
            }
        }

        return rows;
    }

    private Map<String, Object> buildDashboardReportPreview(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime from,
            LocalDateTime to
    ) {
        Date start = Date.from(from.atZone(ZoneId.systemDefault()).toInstant());
        Date end = Date.from(to.atZone(ZoneId.systemDefault()).toInstant());
        List<Order> paidOrders = orderRep.findByStatusAndDateCreateBetweenOrderByDateCreateDesc(Order.OrderStatus.PAID, start, end);
        double revenue = paidOrders.stream().mapToDouble(this::platformRevenue).sum();
        double grossRevenue = paidOrders.stream().mapToDouble(order -> order.getAmount() != null ? order.getAmount() : 0).sum();
        double averageFee = paidOrders.isEmpty() ? 0 : grossRevenue / paidOrders.size();

        List<com.tmdt.web.entity.Dispute> disputes = disputeRep.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        long refundedDisputes = disputes.stream().filter(dispute -> dispute.getStatus() == DisputeStatus.REFUNDED).count();
        double refundRate = disputes.isEmpty() ? 0 : Math.round((refundedDisputes * 1000.0) / disputes.size()) / 10.0;

        Map<String, Object> response = new HashMap<>();
        response.put("metrics", List.of(
                metric("Tổng doanh thu", revenue, "Từ đơn hàng đã thanh toán"),
                metric("Học phí trung bình", averageFee, paidOrders.isEmpty() ? "Chưa có giao dịch" : paidOrders.size() + " giao dịch"),
                metric("Tỷ lệ hoàn tiền", refundRate, disputes.isEmpty() ? "Chưa có tranh chấp" : refundedDisputes + " tranh chấp hoàn tiền")
        ));
        response.put("chart", buildRevenueChart(paidOrders, fromDate, toDate));
        response.put("rows", paidOrders.stream().limit(5).map(order -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", "#ORD-" + order.getId());
            row.put("date", order.getDateCreate());
            row.put("tutorName", "-");
            row.put("studentName", order.getStudentId() > 0 ? "ID " + order.getStudentId() : "-");
            row.put("amount", order.getAmount() != null ? order.getAmount() : 0);
            row.put("platformFee", platformRevenue(order));
            row.put("tutorEarning", tutorEarning(order));
            return row;
        }).toList());
        return response;
    }

    private Map<String, Object> buildUsersReportPreview(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime from,
            LocalDateTime to
    ) {
        List<User> users = userRep.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        long total = users.size();
        long students = users.stream().filter(user -> user.getRole() == User.RoleAcc.STUDENT).count();
        long tutors = users.stream().filter(user -> user.getRole() == User.RoleAcc.TUTOR).count();
        long locked = users.stream().filter(user -> Boolean.FALSE.equals(user.getEnabled())).count();

        Map<String, Object> response = new HashMap<>();
        response.put("metrics", List.of(
                metric("Người dùng mới", total, "Trong khoảng thời gian đã chọn"),
                metric("Học viên", students, "Tài khoản role STUDENT"),
                metric("Tài khoản đã khóa", locked, tutors + " gia sư trong cùng kỳ")
        ));
        response.put("chart", buildUserChart(users, fromDate, toDate));
        response.put("rows", users.stream().limit(5).map(user -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", "#USR-" + user.getId());
            row.put("date", user.getCreatedAt());
            row.put("tutorName", user.getFullName());
            row.put("studentName", user.getRole() != null ? user.getRole().name() : "-");
            row.put("amount", 0);
            return row;
        }).toList());
        return response;
    }

    private Map<String, Object> buildTutorsReportPreview(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime from,
            LocalDateTime to
    ) {
        List<User> tutors = userRep.findByRoleAndCreatedAtBetweenOrderByCreatedAtDesc(User.RoleAcc.TUTOR, from, to);
        long withProfile = tutors.stream().filter(tutor -> tutorProfileRep.findByUserId(tutor.getId()).isPresent()).count();
        long verified = tutors.stream()
                .map(tutor -> tutorProfileRep.findByUserId(tutor.getId()).orElse(null))
                .filter(profile -> profile != null && Boolean.TRUE.equals(profile.getIsVerified()))
                .count();
        long locked = tutors.stream().filter(tutor -> Boolean.FALSE.equals(tutor.getEnabled())).count();

        Map<String, Object> response = new HashMap<>();
        response.put("metrics", List.of(
                metric("Gia sư mới", tutors.size(), "Trong khoảng thời gian đã chọn"),
                metric("Đã upload hồ sơ", withProfile, "Có hồ sơ gia sư"),
                metric("Đã duyệt", verified, locked + " tài khoản bị khóa")
        ));
        response.put("chart", buildUserChart(tutors, fromDate, toDate));
        response.put("rows", tutors.stream().limit(5).map(tutor -> {
            TutorProfile profile = tutorProfileRep.findByUserId(tutor.getId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", "#TUT-" + tutor.getId());
            row.put("date", tutor.getCreatedAt());
            row.put("tutorName", tutor.getFullName());
            row.put("studentName", profile == null ? "Chưa upload hồ sơ" : Boolean.TRUE.equals(profile.getIsVerified()) ? "Đã duyệt" : "Chờ duyệt");
            row.put("amount", 0);
            return row;
        }).toList());
        return response;
    }

    private Map<String, Object> buildDisputesReportPreview(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime from,
            LocalDateTime to
    ) {
        List<com.tmdt.web.entity.Dispute> disputes = disputeRep.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        BigDecimal totalAmount = disputes.stream()
                .map(dispute -> dispute.getAmount() != null ? dispute.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long activeDisputes = disputes.stream()
                .filter(dispute -> dispute.getStatus() == DisputeStatus.PENDING
                        || dispute.getStatus() == DisputeStatus.REVIEWING
                        || dispute.getStatus() == DisputeStatus.NEED_EVIDENCE)
                .count();
        long resolvedDisputes = disputes.stream()
                .filter(dispute -> dispute.getStatus() == DisputeStatus.RESOLVED
                        || dispute.getStatus() == DisputeStatus.REFUNDED
                        || dispute.getStatus() == DisputeStatus.REJECTED
                        || dispute.getStatus() == DisputeStatus.CLOSED)
                .count();
        double successRate = disputes.isEmpty() ? 0 : Math.round((resolvedDisputes * 1000.0) / disputes.size()) / 10.0;

        Map<String, Object> response = new HashMap<>();
        response.put("metrics", List.of(
                metric("Tổng tranh chấp", disputes.size(), "Trong khoảng thời gian đã chọn"),
                metric("Đang xử lý", activeDisputes, "Cần admin theo dõi"),
                metric("Tỷ lệ đã giải quyết", successRate, resolvedDisputes + " hồ sơ đã xử lý")
        ));
        response.put("chart", buildDisputeChart(disputes, fromDate, toDate));
        response.put("rows", disputes.stream().limit(5).map(dispute -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", "#" + dispute.getCaseCode());
            row.put("date", dispute.getCreatedAt());
            row.put("tutorName", dispute.getTutor() != null ? dispute.getTutor().getFullName() : "-");
            row.put("studentName", dispute.getStudent() != null ? dispute.getStudent().getFullName() : "-");
            row.put("amount", dispute.getAmount() != null ? dispute.getAmount() : BigDecimal.ZERO);
            return row;
        }).toList());
        return response;
    }

    private Map<String, Object> metric(String label, Object value, String detail) {
        Map<String, Object> metric = new LinkedHashMap<>();
        metric.put("label", label);
        metric.put("value", value != null ? value : 0);
        metric.put("detail", detail != null ? detail : "");
        return metric;
    }

    private List<Map<String, Object>> buildRevenueChart(List<Order> orders, LocalDate from, LocalDate to) {
        Map<LocalDate, Double> grouped = new LinkedHashMap<>();
        for (LocalDate date : buildChartBuckets(from, to)) {
            grouped.put(date, 0.0);
        }

        for (Order order : orders) {
            if (order.getDateCreate() == null) continue;
            LocalDate orderDate = order.getDateCreate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            LocalDate bucket = closestBucket(orderDate, grouped);
            grouped.put(bucket, grouped.getOrDefault(bucket, 0.0) + platformRevenue(order));
        }

        return grouped.entrySet().stream().map(entry -> chartPoint(entry.getKey(), entry.getValue())).toList();
    }

    private double platformRevenue(Order order) {
        if (order == null) {
            return 0;
        }
        if (order.getPlatformFee() != null) {
            return order.getPlatformFee();
        }
        return order.getAmount() != null ? Math.round(order.getAmount() * 0.1) : 0;
    }

    private double tutorEarning(Order order) {
        if (order == null) {
            return 0;
        }
        if (order.getTutorEarning() != null) {
            return order.getTutorEarning();
        }
        double amount = order.getAmount() != null ? order.getAmount() : 0;
        return amount - platformRevenue(order);
    }

    private List<Map<String, Object>> buildDisputeChart(List<com.tmdt.web.entity.Dispute> disputes, LocalDate from, LocalDate to) {
        Map<LocalDate, Long> grouped = new LinkedHashMap<>();
        for (LocalDate date : buildChartBuckets(from, to)) {
            grouped.put(date, 0L);
        }

        for (com.tmdt.web.entity.Dispute dispute : disputes) {
            if (dispute.getCreatedAt() == null) continue;
            LocalDate disputeDate = dispute.getCreatedAt().toLocalDate();
            LocalDate bucket = closestBucket(disputeDate, grouped);
            grouped.put(bucket, grouped.getOrDefault(bucket, 0L) + 1);
        }

        return grouped.entrySet().stream().map(entry -> chartPoint(entry.getKey(), entry.getValue())).toList();
    }

    private List<Map<String, Object>> buildUserChart(List<User> users, LocalDate from, LocalDate to) {
        Map<LocalDate, Long> grouped = new LinkedHashMap<>();
        for (LocalDate date : buildChartBuckets(from, to)) {
            grouped.put(date, 0L);
        }

        for (User user : users) {
            if (user.getCreatedAt() == null) continue;
            LocalDate createdDate = user.getCreatedAt().toLocalDate();
            LocalDate bucket = closestBucket(createdDate, grouped);
            grouped.put(bucket, grouped.getOrDefault(bucket, 0L) + 1);
        }

        return grouped.entrySet().stream().map(entry -> chartPoint(entry.getKey(), entry.getValue())).toList();
    }

    private List<LocalDate> buildChartBuckets(LocalDate from, LocalDate to) {
        long days = Math.max(ChronoUnit.DAYS.between(from, to), 1);
        int bucketCount = (int) Math.min(days + 1, 8);
        List<LocalDate> buckets = new ArrayList<>();
        for (int index = 0; index < bucketCount; index++) {
            long offset = bucketCount == 1 ? 0 : Math.round((double) index * days / (bucketCount - 1));
            buckets.add(from.plusDays(offset));
        }
        return buckets;
    }

    private LocalDate closestBucket(LocalDate date, Map<LocalDate, ?> buckets) {
        LocalDate selected = buckets.keySet().iterator().next();
        long smallestDistance = Long.MAX_VALUE;
        for (LocalDate bucket : buckets.keySet()) {
            long distance = Math.abs(ChronoUnit.DAYS.between(date, bucket));
            if (distance < smallestDistance) {
                selected = bucket;
                smallestDistance = distance;
            }
        }
        return selected;
    }

    private Map<String, Object> chartPoint(LocalDate date, Object value) {
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("label", String.format("%02d/%02d", date.getDayOfMonth(), date.getMonthValue()));
        point.put("value", value != null ? value : 0);
        return point;
    }

    private void appendCsvRow(StringBuilder csv, Object... values) {
        for (int index = 0; index < values.length; index++) {
            if (index > 0) {
                csv.append(',');
            }
            csv.append(escapeCsv(values[index]));
        }
        csv.append('\n');
    }

    private String escapeCsv(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return "";
    }
}
