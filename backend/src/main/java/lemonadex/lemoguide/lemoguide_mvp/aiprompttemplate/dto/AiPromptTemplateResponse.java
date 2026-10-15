package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;

public record AiPromptTemplateResponse(
        Long id,
        ActionType actionType,
        Long modelId,
        String promptText,
        Integer version,
        boolean isActive,
        Long createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static AiPromptTemplateResponse from(AiPromptTemplate t) {
        return new AiPromptTemplateResponse(t.getId(), t.getActionType(), t.getModelId(), t.getPromptText(),
                t.getVersion(), t.getIsActive(), t.getCreatedBy(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
