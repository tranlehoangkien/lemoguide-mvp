package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;

/** Create / replace payload for an {@code ai_prompt_template}. */
public record AiPromptTemplateRequest(
        @NotNull ActionType actionType,
        @NotNull Long modelId,
        @NotBlank String promptText,
        boolean isActive
) {
}
