package lemonadex.lemoguide.lemoguide_mvp.plan.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanRequest;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanResponse;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for subscription {@code plan}s (Free / Pro / Enterprise). */
@RestController
@RequestMapping("/api/admin/plans")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ApiResponse<PageResponse<PlanResponse>> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PlanResponse> page = planService.search(new PlanSearchCriteria(keyword), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlanResponse>> create(@Valid @RequestBody PlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plan created", planService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<PlanResponse> get(@PathVariable Long id) {
        return ApiResponse.success(planService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<PlanResponse> update(@PathVariable Long id, @Valid @RequestBody PlanRequest request) {
        return ApiResponse.success("Plan updated", planService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        planService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted", null));
    }
}
