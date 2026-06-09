package com.tmdt.web.controller;

import com.tmdt.web.dto.request.DisputeCreateRequest;
import com.tmdt.web.dto.request.DisputeEvidenceRequest;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.DisputeService;
import com.tmdt.web.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final JwtService jwtService;
    private final UserRep userRep;
    private final DisputeService disputeService;

    @PostMapping
    public ResponseEntity<?> createDispute(
            HttpServletRequest request,
            @Valid @RequestBody DisputeCreateRequest disputeRequest
    ) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập để tạo tranh chấp");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(disputeService.createDispute(user, disputeRequest));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyDisputes(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập");
        }

        return ResponseEntity.ok(disputeService.getMyDisputes(
                user,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        ));
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<?> getMyDisputeDetail(HttpServletRequest request, @PathVariable Long disputeId) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập");
        }

        return ResponseEntity.ok(disputeService.getMyDisputeDetail(user, disputeId));
    }

    @PostMapping("/{disputeId}/evidence")
    public ResponseEntity<?> addEvidence(
            HttpServletRequest request,
            @PathVariable Long disputeId,
            @RequestBody DisputeEvidenceRequest evidenceRequest
    ) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập");
        }

        return ResponseEntity.ok(disputeService.addEvidence(disputeId, user, evidenceRequest));
    }

    private User getUserFromRequest(HttpServletRequest request) {
        String token = extractBearerToken(request);
        if (token == null || !jwtService.validateToken(token)) {
            return null;
        }

        return userRep.findByEmail(jwtService.extractUsername(token)).orElse(null);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }
}
