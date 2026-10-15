package lemonadex.lemoguide.lemoguide_mvp.aimodel.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelResponse;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.service.AiModelService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;

/**
 * Public/User-facing endpoint for retrieving active AI models
 * for chat and prompt selector dropdowns.
 */
@RestController
@RequestMapping("/api/ai-models")
@RequiredArgsConstructor
public class UserAiModelController {

    private final AiModelService aiModelService;

    @GetMapping
    public ApiResponse<List<AiModelResponse>> listActiveModels() {
        return ApiResponse.success(aiModelService.getActiveModels());
    }
}
