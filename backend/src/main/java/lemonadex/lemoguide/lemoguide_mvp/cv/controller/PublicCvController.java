package lemonadex.lemoguide.lemoguide_mvp.cv.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.PublicCvProfileResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.VerifySharePasswordRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.service.PublicCvProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Anonymous access to a CV shared via its public link. Returns only CV
 * metadata; assembling the full CV content for public rendering belongs to a
 * separate composition layer outside this migration's scope.
 */
@RestController
@RequestMapping("/api/public/cv-profiles")
@RequiredArgsConstructor
public class PublicCvController {

    private final PublicCvProfileService publicCvProfileService;

    @GetMapping("/{slug}")
    public ApiResponse<PublicCvProfileResponse> view(@PathVariable String slug) {
        return ApiResponse.success(publicCvProfileService.view(slug));
    }

    @PostMapping("/{slug}/verify")
    public ApiResponse<PublicCvProfileResponse> verify(
            @PathVariable String slug, @Valid @RequestBody VerifySharePasswordRequest request) {
        return ApiResponse.success(publicCvProfileService.verifyPassword(slug, request.password()));
    }
}
