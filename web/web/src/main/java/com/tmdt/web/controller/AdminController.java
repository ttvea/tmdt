package com.tmdt.web.controller;

import com.tmdt.web.dto.response.AdminDashboardResponse;
import com.tmdt.web.dto.request.AdminCreateUserRequest;
import com.tmdt.web.dto.request.AdminUpdateUserRoleRequest;
import com.tmdt.web.dto.request.AdminUpdateUserStatusRequest;
import com.tmdt.web.dto.request.AdminAssignSupportTicketRequest;
import com.tmdt.web.dto.request.AdminDisputeNoteRequest;
import com.tmdt.web.dto.request.AdminResolveDisputeRequest;
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
    private final PasswordEncoder passwordEncoder;
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

        String csv = switch (type) {
            case DASHBOARD -> buildDashboardReportCsv(startDate, endDate);
            case DISPUTES -> buildDisputesReportCsv(start, end);
        };

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

    private String buildDashboardReportCsv(LocalDate from, LocalDate to) {
        Double revenue = orderRep.sumAmountByStatus(Order.OrderStatus.PAID.name());

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

    private Map<String, Object> buildDashboardReportPreview(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime from,
            LocalDateTime to
    ) {
        Date start = Date.from(from.atZone(ZoneId.systemDefault()).toInstant());
        Date end = Date.from(to.atZone(ZoneId.systemDefault()).toInstant());
        List<Order> paidOrders = orderRep.findByStatusAndDateCreateBetweenOrderByDateCreateDesc(Order.OrderStatus.PAID, start, end);
        double revenue = paidOrders.stream().mapToDouble(order -> order.getAmount() != null ? order.getAmount() : 0).sum();
        double averageFee = paidOrders.isEmpty() ? 0 : revenue / paidOrders.size();

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
            grouped.put(bucket, grouped.getOrDefault(bucket, 0.0) + (order.getAmount() != null ? order.getAmount() : 0));
        }

        return grouped.entrySet().stream().map(entry -> chartPoint(entry.getKey(), entry.getValue())).toList();
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
}
