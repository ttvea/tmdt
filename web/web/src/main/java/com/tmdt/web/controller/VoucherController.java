package com.tmdt.web.controller;

import com.tmdt.web.dto.request.VoucherRequest;
import com.tmdt.web.dto.response.VoucherResponse;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final JwtService jwtService;
    private final UserRep userRep;

    @PostMapping
    public ResponseEntity<VoucherResponse> createVoucher(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody VoucherRequest request) {
        Long currentUserId = getUserId(authHeader);
        return ResponseEntity.ok(voucherService.createTutorVoucher(currentUserId, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<VoucherResponse>> getMyVouchers(
            @RequestHeader("Authorization") String authHeader) {
        Long currentUserId = getUserId(authHeader);
        return ResponseEntity.ok(voucherService.getMyVouchers(currentUserId));
    }

    @PutMapping("/{voucherId}")
    public ResponseEntity<VoucherResponse> updateVoucher(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long voucherId,
            @Valid @RequestBody VoucherRequest request) {
        Long currentUserId = getUserId(authHeader);
        return ResponseEntity.ok(voucherService.updateTutorVoucher(currentUserId, voucherId, request));
    }

    @PatchMapping("/{voucherId}/status")
    public ResponseEntity<VoucherResponse> updateVoucherStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long voucherId,
            @RequestParam boolean active) {
        Long currentUserId = getUserId(authHeader);
        return ResponseEntity.ok(voucherService.updateVoucherStatus(currentUserId, voucherId, active));
    }

    @DeleteMapping("/{voucherId}")
    public ResponseEntity<Void> deleteExpiredVoucher(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long voucherId) {
        Long currentUserId = getUserId(authHeader);
        voucherService.deleteExpiredVoucher(currentUserId, voucherId);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtService.extractUsername(token);
        return (long) userRep.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"))
                .getId();
    }
}
