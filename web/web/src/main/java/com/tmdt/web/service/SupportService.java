package com.tmdt.web.service;

import com.tmdt.web.dto.request.SupportTicketRequest;
import com.tmdt.web.dto.response.AdminSupportStatsResponse;
import com.tmdt.web.dto.response.SupportReplyResponse;
import com.tmdt.web.dto.response.SupportTicketResponse;
import com.tmdt.web.entity.SupportReply;
import com.tmdt.web.entity.SupportTicket;
import com.tmdt.web.entity.User;
import com.tmdt.web.enums.SupportCategory;
import com.tmdt.web.enums.SupportPriority;
import com.tmdt.web.enums.SupportStatus;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.SupportReplyRep;
import com.tmdt.web.repository.SupportTicketRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportTicketRep supportTicketRep;
    private final SupportReplyRep supportReplyRep;
    private final UserRep userRep;

    @Transactional
    public SupportTicketResponse createTicket(User requester, SupportTicketRequest request) {
        SupportTicket ticket = SupportTicket.builder()
                .ticketCode(generateTicketCode())
                .requester(requester)
                .subject(request.subject().trim())
                .category(request.category() != null ? request.category() : SupportCategory.OTHER)
                .priority(request.priority() != null ? request.priority() : SupportPriority.NORMAL)
                .status(SupportStatus.OPEN)
                .message(request.message().trim())
                .build();

        return SupportTicketResponse.from(supportTicketRep.save(ticket));
    }

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> getMyTickets(User requester, Pageable pageable) {
        return supportTicketRep.findByRequesterId(requester.getId(), pageable)
                .map(SupportTicketResponse::from);
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse getMyTicketDetail(User requester, Long ticketId) {
        SupportTicket ticket = supportTicketRep.findById(ticketId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hỗ trợ"));

        if (!ticket.getRequester().getId().equals(requester.getId())) {
            throw AppException.forbidden("Bạn không có quyền xem yêu cầu hỗ trợ này");
        }

        return toDetailResponse(ticket);
    }

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> getAdminTickets(
            SupportStatus status,
            SupportCategory category,
            SupportPriority priority,
            String keyword,
            Pageable pageable
    ) {
        String normalizedKeyword = keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null;
        return supportTicketRep.searchAdminTickets(status, category, priority, normalizedKeyword, pageable)
                .map(SupportTicketResponse::from);
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse getAdminTicketDetail(Long ticketId) {
        SupportTicket ticket = supportTicketRep.findById(ticketId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hỗ trợ"));
        return toDetailResponse(ticket);
    }

    @Transactional(readOnly = true)
    public AdminSupportStatsResponse getAdminStats() {
        return new AdminSupportStatsResponse(
                supportTicketRep.count(),
                supportTicketRep.countByStatus(SupportStatus.OPEN),
                supportTicketRep.countByStatus(SupportStatus.IN_PROGRESS),
                supportTicketRep.countByStatus(SupportStatus.WAITING_USER),
                supportTicketRep.countByStatus(SupportStatus.RESOLVED),
                supportTicketRep.countByStatus(SupportStatus.CLOSED),
                supportTicketRep.countByPriority(SupportPriority.URGENT)
        );
    }

    @Transactional
    public SupportTicketResponse updateStatus(Long ticketId, SupportStatus status) {
        SupportTicket ticket = supportTicketRep.findById(ticketId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hỗ trợ"));

        ticket.setStatus(status);
        if (status == SupportStatus.RESOLVED || status == SupportStatus.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
        } else {
            ticket.setResolvedAt(null);
        }

        return toDetailResponse(supportTicketRep.save(ticket));
    }

    @Transactional
    public SupportTicketResponse assignTicket(Long ticketId, Integer adminId) {
        SupportTicket ticket = supportTicketRep.findById(ticketId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hỗ trợ"));

        if (adminId == null) {
            ticket.setAssignedAdmin(null);
            return toDetailResponse(supportTicketRep.save(ticket));
        }

        User admin = userRep.findById(adminId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy admin"));

        if (admin.getRole() != User.RoleAcc.ADMIN) {
            throw AppException.badRequest("Chỉ có thể gán yêu cầu cho tài khoản admin");
        }

        ticket.setAssignedAdmin(admin);
        return toDetailResponse(supportTicketRep.save(ticket));
    }

    @Transactional
    public SupportTicketResponse addReply(Long ticketId, User sender, String message, boolean adminReply) {
        SupportTicket ticket = supportTicketRep.findById(ticketId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu hỗ trợ"));

        if (!adminReply && !ticket.getRequester().getId().equals(sender.getId())) {
            throw AppException.forbidden("Bạn không có quyền phản hồi yêu cầu hỗ trợ này");
        }

        SupportReply reply = SupportReply.builder()
                .ticket(ticket)
                .sender(sender)
                .message(message.trim())
                .adminReply(adminReply)
                .build();

        supportReplyRep.save(reply);

        if (adminReply && ticket.getStatus() == SupportStatus.OPEN) {
            ticket.setStatus(SupportStatus.IN_PROGRESS);
        } else if (!adminReply && ticket.getStatus() == SupportStatus.WAITING_USER) {
            ticket.setStatus(SupportStatus.IN_PROGRESS);
        }

        supportTicketRep.save(ticket);
        return toDetailResponse(ticket);
    }

    private SupportTicketResponse toDetailResponse(SupportTicket ticket) {
        List<SupportReplyResponse> replies = supportReplyRep.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream()
                .map(SupportReplyResponse::from)
                .toList();

        return SupportTicketResponse.from(ticket, replies);
    }

    private String generateTicketCode() {
        String code;
        do {
            code = "SP-" + LocalDateTime.now().getYear() + "-" + (int) (Math.random() * 900000 + 100000);
        } while (supportTicketRep.existsByTicketCode(code));
        return code;
    }
}
