package lemonadex.lemoguide.lemoguide_mvp.dashboard.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.dashboard.dto.DashboardSummaryResponse;
import lemonadex.lemoguide.lemoguide_mvp.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;

/** Aggregate KPIs for the admin console's Dashboard overview page. */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> summary() {
        return ApiResponse.success(dashboardService.getSummary());
    }
}
