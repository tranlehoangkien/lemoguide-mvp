package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;

/**
 * Create / replace payload for an {@code ai_generation_log} entry. In normal
 * operation these rows are written by the (future) AI orchestration service
 * right after it calls the model, not typed in by hand; the admin CRUD here
 * exists mainly to correct or remove a bad entry.
 */
public record AiGenerationLogRequest(
        @NotNull Long accountId,
        Long cvProfileId,
        @NotNull Long promptTemplateId,
        @NotNull ActionType actionType,
        String inputSummary,
        String outputSummary,
        @NotNull @PositiveOrZero Integer inputTokens,
        @NotNull @PositiveOrZero Integer outputTokens,
        @NotNull @PositiveOrZero BigDecimal cost,
        @NotNull GenerationStatus status,
        String errorMessage
) {
}
