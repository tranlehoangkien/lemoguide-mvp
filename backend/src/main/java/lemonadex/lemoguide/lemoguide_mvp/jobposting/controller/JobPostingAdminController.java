package lemonadex.lemoguide.lemoguide_mvp.jobposting.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingAdminRequest;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingAdminResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.dto.JobPostingSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.EmploymentType;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.ExperienceLevel;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.service.JobPostingAdminService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code job_posting} catalog (Su nghiep > Viec lam phu hop). */
@RestController
@RequestMapping("/api/admin/job-postings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class JobPostingAdminController {

    private final JobPostingAdminService jobPostingAdminService;

    @GetMapping
    public ApiResponse<PageResponse<JobPostingAdminResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) String experienceLevel,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        JobPostingSearchCriteria criteria = new JobPostingSearchCriteria(
                keyword, location, parseEnum(EmploymentType.class, employmentType), parseEnum(ExperienceLevel.class, experienceLevel));
        Page<JobPostingAdminResponse> page = jobPostingAdminService.search(criteria, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<JobPostingAdminResponse>> create(@Valid @RequestBody JobPostingAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Job posting created", jobPostingAdminService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<JobPostingAdminResponse> get(@PathVariable Long id) {
        return ApiResponse.success(jobPostingAdminService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<JobPostingAdminResponse> update(@PathVariable Long id, @Valid @RequestBody JobPostingAdminRequest request) {
        return ApiResponse.success("Job posting updated", jobPostingAdminService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        jobPostingAdminService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Job posting removed", null));
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
