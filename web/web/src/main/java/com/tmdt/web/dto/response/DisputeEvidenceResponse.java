package com.tmdt.web.dto.response;

import com.tmdt.web.entity.DisputeEvidence;

import java.time.LocalDateTime;

public record DisputeEvidenceResponse(
        Long id,
        Integer uploadedById,
        String uploadedByName,
        String uploadedByRole,
        String note,
        String fileUrl,
        String fileType,
        LocalDateTime createdAt
) {
    public static DisputeEvidenceResponse from(DisputeEvidence evidence) {
        return new DisputeEvidenceResponse(
                evidence.getId(),
                evidence.getUploadedBy().getId(),
                evidence.getUploadedBy().getFullName(),
                evidence.getUploadedBy().getRole() != null ? evidence.getUploadedBy().getRole().name() : null,
                evidence.getNote(),
                evidence.getFileUrl(),
                evidence.getFileType(),
                evidence.getCreatedAt()
        );
    }
}
