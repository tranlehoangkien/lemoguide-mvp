package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;

/** Admin console: reports, system settings, activity log and module permissions (module checks: AdminAccessInterceptor). */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminConsoleController {
    private final AdminReportService reports;
    private final SystemSettingService settings;
    private final AdminActivityService activity;
    private final AdminPermissionService permissions;

    public record PermissionsInput(@NotNull List<String> permissions) { }

    @GetMapping("/reports/technologies")
    public ApiResponse<?> technologies(@RequestParam(defaultValue = "") String category, @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(reports.technologies(category, limit));
    }

    @GetMapping("/reports/skills")
    public ApiResponse<?> skills(@RequestParam(defaultValue = "") String type, @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(reports.skills(type, limit));
    }

    @GetMapping("/reports/target-modes")
    public ApiResponse<?> targetModes() { return ApiResponse.success(reports.targetModes()); }

    @GetMapping("/reports/public-cvs")
    public ApiResponse<?> publicCvs(@RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "") String targetMode,
                                    @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(reports.publicCvs(q, targetMode, page, size));
    }

    @GetMapping("/settings/cv-publish")
    public ApiResponse<?> cvPublish() { return ApiResponse.success(settings.cvPublishOverview()); }

    @PutMapping("/settings/cv-publish")
    public ApiResponse<?> updateCvPublish(@Valid @RequestBody SystemSettingService.CvPublishSettings request) {
        return ApiResponse.success(settings.updateCvPublish(request));
    }

    @GetMapping("/activity-logs")
    public ApiResponse<?> activityLogs(@RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "") String module,
                                       @RequestParam(defaultValue = "") String method, @RequestParam(defaultValue = "") String outcome,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                       @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(activity.list(q, module, method, outcome, from, to, page, size));
    }

    @GetMapping("/activity-logs/modules")
    public ApiResponse<?> activityModules() { return ApiResponse.success(activity.modules()); }

    @GetMapping("/permissions")
    public ApiResponse<?> permissionOverview() { return ApiResponse.success(permissions.overview()); }

    @PutMapping("/permissions/{accountId}")
    public ApiResponse<?> updatePermissions(@PathVariable long accountId, @Valid @RequestBody PermissionsInput request) {
        permissions.update(accountId, request.permissions());
        return ApiResponse.success(null);
    }

    /** The signed-in admin's modules; open to every admin so the console can hide what they cannot use. */
    @GetMapping("/me/permissions")
    public ApiResponse<?> myPermissions() { return ApiResponse.success(permissions.permissionsOf(SecurityUtils.currentAccountId())); }
}
