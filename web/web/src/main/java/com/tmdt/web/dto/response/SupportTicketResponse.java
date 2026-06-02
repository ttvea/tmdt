package com.tmdt.web.dto.response;

import com.tmdt.web.entity.SupportTicket;
import com.tmdt.web.enums.SupportCategory;
import com.tmdt.web.enums.SupportPriority;
import com.tmdt.web.enums.SupportStatus;

import java.time.LocalDateTime;
import java.util.List;

public record SupportTicketResponse(
        Long id,
        String ticketCode,
        Integer requesterId,
        String requesterName,
        String requesterEmail,
        String requesterRole,
        String requesterAvatar,
        String subject,
        SupportCategory category,
        SupportPriority priority,
        SupportStatus status,
        String message,
        Integer assignedAdminId,
        String assignedAdminName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime resolvedAt,
        List<SupportReplyResponse> replies
) {
    public static SupportTicketResponse from(SupportTicket ticket) {
        return from(ticket, List.of());
    }

    public static SupportTicketResponse from(SupportTicket ticket, List<SupportReplyResponse> replies) {
        return new SupportTicketResponse(
                ticket.getId(),
                ticket.getTicketCode(),
                ticket.getRequester().getId(),
                ticket.getRequester().getFullName(),
                ticket.getRequester().getEmail(),
                ticket.getRequester().getRole() != null ? ticket.getRequester().getRole().name() : null,
                ticket.getRequester().getAvatar(),
                ticket.getSubject(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getMessage(),
                ticket.getAssignedAdmin() != null ? ticket.getAssignedAdmin().getId() : null,
                ticket.getAssignedAdmin() != null ? ticket.getAssignedAdmin().getFullName() : null,
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt(),
                replies
        );
    }
}
