package com.tmdt.web.dto.request;

public record AdminSupportDisputeSettingsRequest(
        Integer supportSlaHours,
        String supportCategories,
        String disputeReasons,
        Integer evidenceDeadlineHours,
        String defaultRefundPolicy,
        String needEvidenceMessage,
        String disputeResolvedMessage
) {
}
