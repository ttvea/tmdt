package com.tmdt.web.dto.response;

public record AdminUsersStatsResponse(
        long totalUsers,
        long totalStudents,
        long totalTutors,
        long totalAdmins,
        long activeUsers,
        long lockedUsers,
        long newUsersThisWeek
) {
}
