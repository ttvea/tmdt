package com.tmdt.web.controller;

import com.tmdt.web.dto.request.AdminReviewClassRequest;
import com.tmdt.web.dto.request.ClassCreateRequest;
import com.tmdt.web.dto.request.TutorReviewEnrollmentRequest;
import com.tmdt.web.dto.response.ClassResponse;
import com.tmdt.web.dto.response.EnrollmentResponse;
import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.enums.TeachingMode;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.ClassService;
import com.tmdt.web.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService classService;
    private final JwtService jwtService;
    private final UserRep userRep;
    private Long getUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return (long) userRep.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<ClassResponse> createClass(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ClassCreateRequest request) {
        Long tutorId = getUserId(authHeader);
        return ResponseEntity.ok(classService.createClass(request, tutorId));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ClassResponse>> getMyClasses(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long tutorId = getUserId(authHeader);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(classService.getTutorClasses(tutorId, pageable));
    }

    @GetMapping("/my/{classId}")
    public ResponseEntity<ClassResponse> getMyClassDetail(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long classId) {
        Long tutorId = getUserId(authHeader);
        return ResponseEntity.ok(classService.getTutorClassDetail(classId, tutorId));
    }

    @GetMapping("/my/{classId}/enrollments")
    public ResponseEntity<Page<EnrollmentResponse>> getEnrollments(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long classId,
            @RequestParam(required = false) EnrollmentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long tutorId = getUserId(authHeader);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(classService.getEnrollmentsOfClass(classId, tutorId, status, pageable));
    }

    @PutMapping("/enrollments/{enrollmentId}/review")
    public ResponseEntity<EnrollmentResponse> reviewEnrollment(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long enrollmentId,
            @Valid @RequestBody TutorReviewEnrollmentRequest request) {
        Long tutorId = getUserId(authHeader);
        return ResponseEntity.ok(classService.reviewEnrollment(enrollmentId, tutorId, request));
    }

    @PatchMapping("/my/{classId}/status")
    public ResponseEntity<ClassResponse> updateClassStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long classId,
            @RequestParam ClassStatus status) {
        Long tutorId = getUserId(authHeader);
        return ResponseEntity.ok(classService.updateClassStatus(classId, tutorId, status));
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<Page<ClassResponse>> getPendingClasses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return ResponseEntity.ok(classService.getPendingClasses(pageable));
    }

    @PutMapping("/admin/{classId}/review")
    public ResponseEntity<ClassResponse> adminReviewClass(
            @PathVariable Long classId,
            @Valid @RequestBody AdminReviewClassRequest request) {
        return ResponseEntity.ok(classService.adminReviewClass(classId, request));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<Page<ClassResponse>> adminGetAllClasses(
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(classService.adminGetAllClasses(approvalStatus, pageable));
    }

    @GetMapping("/admin/{classId}")
    public ResponseEntity<ClassResponse> adminGetClassDetail(@PathVariable Long classId) {
        return ResponseEntity.ok(classService.adminGetClassDetail(classId));
    }

    @GetMapping("/admin/{classId}/enrollments")
    public ResponseEntity<Page<EnrollmentResponse>> adminGetClassEnrollments(
            @PathVariable Long classId,
            @RequestParam(required = false) EnrollmentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(classService.adminGetClassEnrollments(classId, status, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClassResponse>> searchClasses(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeLevelId,
            @RequestParam(required = false) String teachingMode,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                classService.searchClasses(subjectId, gradeLevelId, teachingMode,title, city, pageable));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ClassResponse> getClassDetail(@PathVariable Long classId) {
        return ResponseEntity.ok(classService.getClassDetail(classId));
    }

    @PostMapping("/{classId}/enroll")
    public ResponseEntity<EnrollmentResponse> enroll(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long classId) {
        Long studentId = getUserId(authHeader);
        return ResponseEntity.ok(classService.enroll(classId, studentId));
    }

    @GetMapping("/my-enrollments")
    public ResponseEntity<Page<EnrollmentResponse>> getMyEnrollments(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long studentId = getUserId(authHeader);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(classService.getStudentEnrollments(studentId, pageable));
    }

    @DeleteMapping("/enrollments/{enrollmentId}")
    public ResponseEntity<EnrollmentResponse> cancelEnrollment(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long enrollmentId) {
        Long studentId = getUserId(authHeader);
        return ResponseEntity.ok(classService.cancelEnrollment(enrollmentId, studentId));
    }

    @PostMapping("/enrollments/{enrollmentId}/pay")
    public ResponseEntity<EnrollmentResponse> confirmPayment(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long enrollmentId) {
        Long studentId = getUserId(authHeader);
        return ResponseEntity.ok(classService.confirmPayment(enrollmentId, studentId));
    }
}
