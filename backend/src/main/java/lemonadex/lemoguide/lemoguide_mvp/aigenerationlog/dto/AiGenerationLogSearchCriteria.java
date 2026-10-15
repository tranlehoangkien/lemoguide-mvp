package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;

/** Filters for {@code GET /api/admin/ai-generation-logs}. Any {@code null} field is ignored. */
public record AiGenerationLogSearchCriteria(
        Long accountId, ActionType actionType, GenerationStatus status
) {
}
