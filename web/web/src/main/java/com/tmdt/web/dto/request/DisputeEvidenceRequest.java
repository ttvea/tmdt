package com.tmdt.web.dto.request;

public record DisputeEvidenceRequest(
        String note,
        String fileUrl,
        String fileType
) {
}
