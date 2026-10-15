package lemonadex.lemoguide.lemoguide_mvp.plan.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanUsageResponse;
import lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class PlanUsageController {
    private final PlanUsageService usage;

    @GetMapping("/api/admin/users/{id}/usage")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PlanUsageResponse> getUserUsage(@PathVariable Long id) {
        return ApiResponse.success(usage.get(id));
    }

    @GetMapping("/api/me/usage")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<PlanUsageResponse> getMyUsage() {
        return ApiResponse.success(usage.get(SecurityUtils.currentAccountId()));
    }
}
