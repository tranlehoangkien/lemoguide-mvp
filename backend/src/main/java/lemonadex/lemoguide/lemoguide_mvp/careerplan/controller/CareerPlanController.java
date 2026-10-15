package lemonadex.lemoguide.lemoguide_mvp.careerplan.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.*;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerPlanService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me/career-plans")
@RequiredArgsConstructor
public class CareerPlanController {
    private final CareerPlanService service;
    @GetMapping("/profile-context")
    public ApiResponse<CareerPlanService.ProfileContext> profileContext() {
        return ApiResponse.success(service.profileContext());
    }
    @PostMapping("/proposals")
    public ApiResponse<CareerProposal> propose(@Valid @RequestBody CareerPlanRequest request) {
        return ApiResponse.success(service.propose(request));
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CareerPlanResponse> create(@Valid @RequestBody CareerPlanRequest request) {
        return ApiResponse.success(service.create(request));
    }
    @GetMapping
    public ApiResponse<PageResponse<CareerPlanResponse.Summary>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.success(PageResponse.from(service.list(pageable)));
    }
    @GetMapping("/{id}")
    public ApiResponse<CareerPlanResponse> get(@PathVariable Long id) { return ApiResponse.success(service.get(id)); }
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
    @PatchMapping("/{id}/tasks/{taskId}")
    public ApiResponse<CareerPlanResponse> updateTask(@PathVariable Long id, @PathVariable Long taskId,
            @Valid @RequestBody CareerTaskRequest request) {
        return ApiResponse.success(service.updateTask(id, taskId, request));
    }
}
