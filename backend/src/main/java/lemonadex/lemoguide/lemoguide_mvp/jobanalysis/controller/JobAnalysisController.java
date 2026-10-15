package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisRequest;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service.JobAnalysisService;
import lombok.RequiredArgsConstructor;

/** Self-service AI analysis of one job posting against the caller's own profile. */
@RestController
@RequestMapping("/api/me/job-postings/{jobId}/ai-analysis")
@RequiredArgsConstructor
public class JobAnalysisController {

    private final JobAnalysisService jobAnalysisService;

    /** The stored analysis (with a {@code stale} flag), or {@code data} absent when none exists yet. */
    @GetMapping
    public ApiResponse<JobAnalysisResponse> get(@PathVariable Long jobId) {
        return ApiResponse.success(jobAnalysisService.getStored(jobId));
    }

    /** Runs (or, when nothing changed, re-serves) the analysis. Body is optional. */
    @PostMapping
    public ApiResponse<JobAnalysisResponse> analyze(@PathVariable Long jobId,
            @RequestBody(required = false) JobAnalysisRequest request) {
        return ApiResponse.success(jobAnalysisService.analyze(jobId, request));
    }
}
