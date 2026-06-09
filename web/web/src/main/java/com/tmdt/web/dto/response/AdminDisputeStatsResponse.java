package com.tmdt.web.dto.response;

import java.math.BigDecimal;

public record AdminDisputeStatsResponse(
        long totalDisputes,
        long activeDisputes,
        long pendingDisputes,
        long resolvedDisputes,
        long refundedDisputes,
        long rejectedDisputes,
        BigDecimal activeAmount,
        double successRate
) {
}
