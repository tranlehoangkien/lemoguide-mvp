package lemonadex.lemoguide.lemoguide_mvp.aimodel.dto;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** Filters for {@code GET /api/admin/ai-models}. Any {@code null} field is ignored. */
public record AiModelSearchCriteria(String keyword, AiProvider provider, Boolean isActive) {
}
