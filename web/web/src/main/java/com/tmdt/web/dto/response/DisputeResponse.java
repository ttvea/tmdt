package com.tmdt.web.dto.response;

import com.tmdt.web.entity.Dispute;
import com.tmdt.web.enums.DisputePriority;
import com.tmdt.web.enums.DisputeResolutionType;
import com.tmdt.web.enums.DisputeStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DisputeResponse(
        Long id,
        String caseCode,
        Long classId,
        String classTitle,
        Integer studentId,
        String studentName,
        Integer tutorId,
        String tutorName,
        Integer createdById,
        String createdByName,
        String reason,
        String description,
        BigDecimal amount,
        DisputeStatus status,
        DisputePriority priority,
        DisputeResolutionType resolutionType,
        String resolutionNote,
        Integer resolvedByAdminId,
        String resolvedByAdminName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime resolvedAt,
        List<DisputeNoteResponse> notes
) {
    public static DisputeResponse from(Dispute dispute) {
        return from(dispute, List.of());
    }

    public static DisputeResponse from(Dispute dispute, List<DisputeNoteResponse> notes) {
        return new DisputeResponse(
                dispute.getId(),
                dispute.getCaseCode(),
                dispute.getTutorClass() != null ? dispute.getTutorClass().getId() : null,
                dispute.getTutorClass() != null ? dispute.getTutorClass().getTitle() : null,
                dispute.getStudent() != null ? dispute.getStudent().getId() : null,
                dispute.getStudent() != null ? dispute.getStudent().getFullName() : null,
                dispute.getTutor() != null ? dispute.getTutor().getId() : null,
                dispute.getTutor() != null ? dispute.getTutor().getFullName() : null,
                dispute.getCreatedBy().getId(),
                dispute.getCreatedBy().getFullName(),
                dispute.getReason(),
                dispute.getDescription(),
                dispute.getAmount(),
                dispute.getStatus(),
                dispute.getPriority(),
                dispute.getResolutionType(),
                dispute.getResolutionNote(),
                dispute.getResolvedByAdmin() != null ? dispute.getResolvedByAdmin().getId() : null,
                dispute.getResolvedByAdmin() != null ? dispute.getResolvedByAdmin().getFullName() : null,
                dispute.getCreatedAt(),
                dispute.getUpdatedAt(),
                dispute.getResolvedAt(),
                notes
        );
    }
}
