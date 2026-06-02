package com.tmdt.web.dto.response;

import com.tmdt.web.entity.SupportReply;

import java.time.LocalDateTime;

public record SupportReplyResponse(
        Long id,
        Integer senderId,
        String senderName,
        String senderRole,
        Boolean adminReply,
        String message,
        LocalDateTime createdAt
) {
    public static SupportReplyResponse from(SupportReply reply) {
        return new SupportReplyResponse(
                reply.getId(),
                reply.getSender().getId(),
                reply.getSender().getFullName(),
                reply.getSender().getRole() != null ? reply.getSender().getRole().name() : null,
                reply.getAdminReply(),
                reply.getMessage(),
                reply.getCreatedAt()
        );
    }
}
