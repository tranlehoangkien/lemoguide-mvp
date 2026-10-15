package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto.AiPromptTemplateRequest;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto.AiPromptTemplateResponse;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto.AiPromptTemplateSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.service.AiPromptTemplateService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for versioned {@code ai_prompt_template}s. */
@RestController
@RequestMapping("/api/admin/ai-prompt-templates")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AiPromptTemplateController {

    private final AiPromptTemplateService aiPromptTemplateService;

    @GetMapping
    public ApiResponse<PageResponse<AiPromptTemplateResponse>> list(
            @RequestParam(required = false) ActionType actionType,
            @RequestParam(required = false) Long modelId,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiPromptTemplateResponse> page = aiPromptTemplateService.search(
                new AiPromptTemplateSearchCriteria(actionType, modelId, isActive), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AiPromptTemplateResponse>> create(
            @Valid @RequestBody AiPromptTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Prompt template created", aiPromptTemplateService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AiPromptTemplateResponse> get(@PathVariable Long id) {
        return ApiResponse.success(aiPromptTemplateService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<AiPromptTemplateResponse> update(
            @PathVariable Long id, @Valid @RequestBody AiPromptTemplateRequest request) {
        return ApiResponse.success("Prompt template updated", aiPromptTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        aiPromptTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Prompt template deleted", null));
    }
}
