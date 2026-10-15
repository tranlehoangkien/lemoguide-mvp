package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;

/** Read-only CV publish settings for the user app's create/edit forms (/api/lookups/** is public). */
@RestController
@RequestMapping("/api/lookups/cv-settings")
@RequiredArgsConstructor
public class CvSettingsLookupController {
    private final SystemSettingService settings;

    @GetMapping
    public ApiResponse<SystemSettingService.CvPublishSettings> get() { return ApiResponse.success(settings.cvPublish()); }
}
