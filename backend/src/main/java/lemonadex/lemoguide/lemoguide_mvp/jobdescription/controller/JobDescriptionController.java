package lemonadex.lemoguide.lemoguide_mvp.jobdescription.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto.JobDescriptionRequest;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto.JobDescriptionResponse;
import lemonadex.lemoguide.lemoguide_mvp.jobdescription.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;

/** Self-service CRUD of the caller's own job descriptions (CV &lt;-&gt; JD matching). */
@RestController
@RequestMapping("/api/me/job-descriptions")
@RequiredArgsConstructor
public class JobDescriptionController {

    private final JobDescriptionService jobDescriptionService;

    @GetMapping
    public ApiResponse<PageResponse<JobDescriptionResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<JobDescriptionResponse> page = jobDescriptionService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<JobDescriptionResponse>> create(
            @Valid @RequestBody JobDescriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Job description added", jobDescriptionService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<JobDescriptionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(jobDescriptionService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<JobDescriptionResponse> update(
            @PathVariable Long id, @Valid @RequestBody JobDescriptionRequest request) {
        return ApiResponse.success("Job description updated", jobDescriptionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        jobDescriptionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Job description removed", null));
    }
}
