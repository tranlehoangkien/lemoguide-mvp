package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.dto;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;

/** Filters for {@code GET /api/admin/ai-prompt-templates}. Any {@code null} field is ignored. */
public record AiPromptTemplateSearchCriteria(ActionType actionType, Long modelId, Boolean isActive) {
}
