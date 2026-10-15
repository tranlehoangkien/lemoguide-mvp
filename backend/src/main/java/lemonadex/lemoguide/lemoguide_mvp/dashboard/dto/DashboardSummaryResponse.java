package lemonadex.lemoguide.lemoguide_mvp.dashboard.dto;

import java.util.List;

/** Aggregate KPIs backing the admin console's Dashboard overview page. */
public record DashboardSummaryResponse(
        long totalUsers,
        long totalCvProfiles,
        long totalPublicViews,
        long newCvThisWeek,
        Double usersGrowthPercent,
        Double cvGrowthPercent,
        List<TopTechnologyResponse> topTechnologies
) {
}
