package lemonadex.lemoguide.lemoguide_mvp.education.controller;

import java.math.BigDecimal;
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
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationRequest;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationResponse;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.education.service.EducationService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own education history. */
@RestController
@RequestMapping("/api/me/education")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @GetMapping
    public ApiResponse<PageResponse<EducationResponse>> list(
            @RequestParam(required = false) String school,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startedOnOrAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endedOnOrBefore,
            @RequestParam(required = false) BigDecimal minGpa,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EducationResponse> page = educationService.search(new EducationSearchCriteria(
                school, majorId, classification, startedOnOrAfter, endedOnOrBefore, minGpa), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EducationResponse>> create(@Valid @RequestBody EducationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Education record added", educationService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<EducationResponse> get(@PathVariable Long id) {
        return ApiResponse.success(educationService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<EducationResponse> update(@PathVariable Long id, @Valid @RequestBody EducationRequest request) {
        return ApiResponse.success("Education record updated", educationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        educationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Education record removed", null));
    }
}
