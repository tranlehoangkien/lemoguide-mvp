package lemonadex.lemoguide.lemoguide_mvp.aimodel.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelRequest;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelResponse;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.service.AiModelService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for {@code ai_model} provider configuration. */
@RestController
@RequestMapping("/api/admin/ai-models")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AiModelController {

    private final AiModelService aiModelService;

    @GetMapping
    public ApiResponse<PageResponse<AiModelResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) AiProvider provider,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiModelResponse> page =
                aiModelService.search(new AiModelSearchCriteria(keyword, provider, isActive), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AiModelResponse>> create(@Valid @RequestBody AiModelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("AI model created", aiModelService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AiModelResponse> get(@PathVariable Long id) {
        return ApiResponse.success(aiModelService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<AiModelResponse> update(@PathVariable Long id, @Valid @RequestBody AiModelRequest request) {
        return ApiResponse.success("AI model updated", aiModelService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        aiModelService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("AI model deleted", null));
    }
}
