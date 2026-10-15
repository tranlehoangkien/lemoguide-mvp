package lemonadex.lemoguide.lemoguide_mvp.profileimport.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.profileimport.dto.ProfileApplyRequest;
import lemonadex.lemoguide.lemoguide_mvp.profileimport.dto.ProfileApplyResponse;
import lemonadex.lemoguide.lemoguide_mvp.profileimport.dto.ProfileExtractRequest;
import lemonadex.lemoguide.lemoguide_mvp.profileimport.service.ProfileImportService;
import lombok.RequiredArgsConstructor;

/** Self-service "extract CV text -> fill in my Dynamic Profile" flow. */
@RestController
@RequestMapping("/api/me/profile-import")
@RequiredArgsConstructor
public class ProfileImportController {

    private final ProfileImportService profileImportService;

    @PostMapping("/extract")
    public ApiResponse<Map<String, String>> extract(@Valid @RequestBody ProfileExtractRequest request) {
        String patch = profileImportService.extract(request.sourceText());
        return ApiResponse.success(Map.of("patch", patch));
    }

    @PostMapping("/apply")
    public ApiResponse<ProfileApplyResponse> apply(@Valid @RequestBody ProfileApplyRequest request) {
        return ApiResponse.success("Đã áp dụng vào hồ sơ", profileImportService.apply(request.patch()));
    }
}
