package com.tmdt.web.dto.response;

import com.tmdt.web.entity.DisputeNote;

import java.time.LocalDateTime;

public record DisputeNoteResponse(
        Long id,
        Integer adminId,
        String adminName,
        String note,
        LocalDateTime createdAt
) {
    public static DisputeNoteResponse from(DisputeNote note) {
        return new DisputeNoteResponse(
                note.getId(),
                note.getAdmin().getId(),
                note.getAdmin().getFullName(),
                note.getNote(),
                note.getCreatedAt()
        );
    }
}
