package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.AiGenerationLog;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;

public record AiGenerationLogResponse(
        Long id,
        Long accountId,
        String accountEmail,
        Long cvProfileId,
        Long promptTemplateId,
        ActionType actionType,
        String inputSummary,
        String outputSummary,
        Integer inputTokens,
        Integer outputTokens,
        BigDecimal cost,
        GenerationStatus status,
        String errorMessage,
        LocalDateTime createdAt
) {

    public static AiGenerationLogResponse from(AiGenerationLog l) {
        return from(l, null);
    }

    /** {@code accountEmail} is a display-only convenience for the admin usage-log screen. */
    public static AiGenerationLogResponse from(AiGenerationLog l, String accountEmail) {
        return new AiGenerationLogResponse(l.getId(), l.getAccountId(), accountEmail, l.getCvProfileId(),
                l.getPromptTemplateId(), l.getActionType(), l.getInputSummary(), l.getOutputSummary(),
                l.getInputTokens(), l.getOutputTokens(), l.getCost(), l.getStatus(), l.getErrorMessage(),
                l.getCreatedAt());
    }
}
