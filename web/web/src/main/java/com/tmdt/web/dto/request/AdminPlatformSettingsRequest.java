package com.tmdt.web.dto.request;

public record AdminPlatformSettingsRequest(
        String siteName,
        String brandName,
        String logoUrl,
        String faviconUrl,
        String hotline,
        String supportEmail,
        String officeAddress,
        String workingHours,
        String zaloUrl,
        String messengerUrl,
        String facebookUrl
) {
}
