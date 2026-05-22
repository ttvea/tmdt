package com.tmdt.web.dto.response;

public record AdminDashboardResponse(
        double totalRevenue,
        long totalUsers,
        long newUsersThisWeek,
        long totalTutors,
        long verifiedTutors,
        long pendingClasses,
        long totalClasses,
        long openClasses,
        long teachingClasses,
        long completedClasses,
        long totalEnrollments,
        long pendingEnrollments,
        long paidEnrollments
) {
}
