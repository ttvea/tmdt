package com.tmdt.web.controller;

import com.tmdt.web.dto.request.SupportReplyRequest;
import com.tmdt.web.dto.request.SupportTicketRequest;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.JwtService;
import com.tmdt.web.service.SupportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final JwtService jwtService;
    private final UserRep userRep;
    private final SupportService supportService;

    @PostMapping("/tickets")
    public ResponseEntity<?> createTicket(
            HttpServletRequest request,
            @Valid @RequestBody SupportTicketRequest ticketRequest
    ) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập để gửi hỗ trợ");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(supportService.createTicket(user, ticketRequest));
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập");
        }

        return ResponseEntity.ok(supportService.getMyTickets(
                user,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        ));
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<?> getMyTicketDetail(HttpServletRequest request, @PathVariable Long ticketId) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập");
        }

        return ResponseEntity.ok(supportService.getMyTicketDetail(user, ticketId));
    }

    @PostMapping("/tickets/{ticketId}/replies")
    public ResponseEntity<?> addReply(
            HttpServletRequest request,
            @PathVariable Long ticketId,
            @Valid @RequestBody SupportReplyRequest replyRequest
    ) {
        User user = getUserFromRequest(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập");
        }

        return ResponseEntity.ok(supportService.addReply(ticketId, user, replyRequest.message(), false));
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
