package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvApplyRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvApplyResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvSuggestRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvSuggestResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvApplyService;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvReviewService;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvSuggestService;
import lombok.RequiredArgsConstructor;

/** AI tasks on one of the caller's own CVs: ATS review, rewrite suggestions, applying and undoing them. */
@RestController
@RequestMapping("/api/me/cv-profiles/{cvProfileId}/ai")
@RequiredArgsConstructor
public class CvOptimizerController {

    private final CvReviewService reviewService;
    private final CvSuggestService suggestService;
    private final CvApplyService applyService;

    /** Runs (or re-serves) the review. With {@code cachedOnly} it only returns the stored one, {@code data} absent if none. */
    @PostMapping("/review")
    public ApiResponse<CvReviewResponse> review(@PathVariable Long cvProfileId,
            @RequestBody(required = false) CvReviewRequest request) {
        return ApiResponse.success(reviewService.review(cvProfileId, request));
    }

    @PostMapping("/suggest")
    public ApiResponse<CvSuggestResponse> suggest(@PathVariable Long cvProfileId,
            @RequestBody(required = false) CvSuggestRequest request) {
        return ApiResponse.success(suggestService.suggest(cvProfileId, request));
    }

    @PostMapping("/apply")
    public ApiResponse<CvApplyResponse> apply(@PathVariable Long cvProfileId, @Valid @RequestBody CvApplyRequest request) {
        return ApiResponse.success(applyService.apply(cvProfileId, request));
    }

    @PostMapping("/undo/{versionId}")
    public ApiResponse<CvProfileResponse> undo(@PathVariable Long cvProfileId, @PathVariable Long versionId) {
        return ApiResponse.success(applyService.undo(cvProfileId, versionId));
    }
}
