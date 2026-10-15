package lemonadex.lemoguide.lemoguide_mvp.experience.controller;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceRequest;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceResponse;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.TargetTag;
import lemonadex.lemoguide.lemoguide_mvp.experience.service.ExperienceService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own work experience history. */
@RestController
@RequestMapping("/api/me/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    public ApiResponse<PageResponse<ExperienceResponse>> list(
            @RequestParam(required = false) String company,
            @RequestParam(required = false) TargetTag targetTag,
            @RequestParam(required = false) Boolean current,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startedOnOrAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endedOnOrBefore,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ExperienceResponse> page = experienceService.search(new ExperienceSearchCriteria(
                company, targetTag, current, startedOnOrAfter, endedOnOrBefore), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExperienceResponse>> create(@Valid @RequestBody ExperienceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Experience record added", experienceService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExperienceResponse> get(@PathVariable Long id) {
        return ApiResponse.success(experienceService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<ExperienceResponse> update(@PathVariable Long id, @Valid @RequestBody ExperienceRequest request) {
        return ApiResponse.success("Experience record updated", experienceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        experienceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Experience record removed", null));
    }
}
