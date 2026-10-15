package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogRequest;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service.AiGenerationLogService;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Admin CRUD/monitoring of {@code ai_generation_log} entries (usage + cost + debugging). */
@RestController
@RequestMapping("/api/admin/ai-generation-logs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AiGenerationLogController {

    private final AiGenerationLogService aiGenerationLogService;

    @GetMapping
    public ApiResponse<PageResponse<AiGenerationLogResponse>> list(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) ActionType actionType,
            @RequestParam(required = false) GenerationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiGenerationLogResponse> page =
                aiGenerationLogService.search(new AiGenerationLogSearchCriteria(accountId, actionType, status), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AiGenerationLogResponse>> create(
            @Valid @RequestBody AiGenerationLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Generation log recorded", aiGenerationLogService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AiGenerationLogResponse> get(@PathVariable Long id) {
        return ApiResponse.success(aiGenerationLogService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<AiGenerationLogResponse> update(
            @PathVariable Long id, @Valid @RequestBody AiGenerationLogRequest request) {
        return ApiResponse.success("Generation log updated", aiGenerationLogService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        aiGenerationLogService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Generation log deleted", null));
    }
}
