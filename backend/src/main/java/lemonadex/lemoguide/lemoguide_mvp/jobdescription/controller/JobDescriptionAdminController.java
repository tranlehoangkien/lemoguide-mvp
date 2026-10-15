package lemonadex.lemoguide.lemoguide_mvp.jobdescription.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto.JobDescriptionResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.service.JobDescriptionAdminService;
import lombok.RequiredArgsConstructor;

/** Read-only oversight of every user's job descriptions. */
@RestController
@RequestMapping("/api/admin/job-descriptions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class JobDescriptionAdminController {

    private final JobDescriptionAdminService jobDescriptionAdminService;

    @GetMapping
    public ApiResponse<PageResponse<JobDescriptionResponse>> list(
            @RequestParam(required = false) Long accountId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<JobDescriptionResponse> page = jobDescriptionAdminService.search(accountId, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/{id}")
    public ApiResponse<JobDescriptionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(jobDescriptionAdminService.get(id));
    }
}
