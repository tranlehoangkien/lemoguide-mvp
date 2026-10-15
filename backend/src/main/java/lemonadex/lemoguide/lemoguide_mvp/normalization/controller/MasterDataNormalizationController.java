package lemonadex.lemoguide.lemoguide_mvp.normalization.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.normalization.dto.NormalizeTermsRequest;
import lemonadex.lemoguide.lemoguide_mvp.normalization.dto.NormalizedTermResponse;
import lemonadex.lemoguide.lemoguide_mvp.normalization.service.SkillTechNormalizationService;
import lombok.RequiredArgsConstructor;

/**
 * Admin-only AI helper for curating the {@code skill}/{@code technology}
 * lookups: given raw free-text terms, suggests a match against the existing
 * rows or a standardized name for a new one. Suggestions only - creating the
 * row is still done through {@code SkillController}/{@code TechnologyController}.
 */
@RestController
@RequestMapping("/api/admin/master-data")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class MasterDataNormalizationController {

    private final SkillTechNormalizationService normalizationService;

    @PostMapping("/normalize")
    public ApiResponse<List<NormalizedTermResponse>> normalize(@Valid @RequestBody NormalizeTermsRequest request) {
        return ApiResponse.success(normalizationService.normalize(request));
    }
}
