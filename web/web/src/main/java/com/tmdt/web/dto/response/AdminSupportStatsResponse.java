package com.tmdt.web.dto.response;

public record AdminSupportStatsResponse(
        long totalTickets,
        long openTickets,
        long inProgressTickets,
        long waitingUserTickets,
        long resolvedTickets,
        long closedTickets,
        long urgentTickets
) {
}
