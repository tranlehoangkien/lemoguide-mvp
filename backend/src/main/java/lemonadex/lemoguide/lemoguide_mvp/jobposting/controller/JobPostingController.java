package lemonadex.lemoguide.lemoguide_mvp.jobposting.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingDetailResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingSummaryResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.EmploymentType;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.ExperienceLevel;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.service.JobPostingService;
import lombok.RequiredArgsConstructor;

/** Self-service read access to job postings for the "Viec lam phu hop" feature. */
@RestController
@RequestMapping("/api/me/job-postings")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService jobPostingService;

    @GetMapping
    public ApiResponse<PageResponse<JobPostingSummaryResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) String experienceLevel,
            @PageableDefault(size = 12, sort = "postedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        JobPostingSearchCriteria criteria = new JobPostingSearchCriteria(
                keyword, location, parseEnum(EmploymentType.class, employmentType), parseEnum(ExperienceLevel.class, experienceLevel));
        Page<JobPostingSummaryResponse> page = jobPostingService.list(criteria, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/locations")
    public ApiResponse<List<String>> locations() {
        return ApiResponse.success(jobPostingService.listLocations());
    }

    @GetMapping("/top-matches")
    public ApiResponse<List<JobPostingSummaryResponse>> topMatches(
            @RequestParam(defaultValue = "3") int limit) {
        return ApiResponse.success(jobPostingService.topMatches(limit));
    }

    @GetMapping("/{id}")
    public ApiResponse<JobPostingDetailResponse> get(@PathVariable Long id) {
        return ApiResponse.success(jobPostingService.get(id));
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
