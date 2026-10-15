package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service.MyAiGenerationLogService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Read-only self-service view of the caller's own AI usage history. */
@RestController
@RequestMapping("/api/me/ai-generation-logs")
@RequiredArgsConstructor
public class MyAiGenerationLogController {

    private final MyAiGenerationLogService myAiGenerationLogService;

    @GetMapping
    public ApiResponse<PageResponse<AiGenerationLogResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiGenerationLogResponse> page = myAiGenerationLogService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/{id}")
    public ApiResponse<AiGenerationLogResponse> get(@PathVariable Long id) {
        return ApiResponse.success(myAiGenerationLogService.get(id));
    }
}
