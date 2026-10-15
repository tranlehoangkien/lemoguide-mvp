package lemonadex.lemoguide.lemoguide_mvp.aimodel.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** Never carries the raw {@code api_key_encrypted} value; only whether one is set. */
public record AiModelResponse(
        Long id,
        AiProvider provider,
        String modelName,
        boolean apiKeyConfigured,
        Integer maxTokensPerRequest,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static AiModelResponse from(AiModel m) {
        return new AiModelResponse(m.getId(), m.getProvider(), m.getModelName(),
                m.getApiKeyEncrypted() != null && !m.getApiKeyEncrypted().isBlank(),
                m.getMaxTokensPerRequest(), m.getIsActive(), m.getCreatedAt(), m.getUpdatedAt());
    }
}
