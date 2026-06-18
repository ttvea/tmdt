package com.tmdt.web.dto.request;

public record AdminApprovalSettingsRequest(
        Boolean requireTutorVerification,
        Boolean tutorMustBeVerifiedToOpenClass,
        String requiredTutorDocuments,
        String tutorApprovedMessage,
        String tutorRejectedMessage,
        Boolean requireClassApproval,
        Integer maxClassesForUnverifiedTutor,
        Integer autoCloseClassAfterDays
) {
}
