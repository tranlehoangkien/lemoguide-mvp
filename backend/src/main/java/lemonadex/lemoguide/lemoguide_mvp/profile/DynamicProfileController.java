package lemonadex.lemoguide.lemoguide_mvp.profile;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class DynamicProfileController {
    private final DynamicProfileService service;

    @GetMapping("/api/me/profile-progress")
    public ApiResponse<DynamicProfileService.Progress> progress() {
        return ApiResponse.success(service.read(SecurityUtils.currentAccountId()));
    }
}
