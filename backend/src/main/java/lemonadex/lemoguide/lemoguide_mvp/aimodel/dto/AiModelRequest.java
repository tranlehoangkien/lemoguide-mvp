package lemonadex.lemoguide.lemoguide_mvp.aimodel.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/**
 * Create / replace payload for an {@code ai_model}. {@code apiKey} is plain text
 * over the wire (HTTPS) and stored as-is in {@code api_key_encrypted}; leave it
 * {@code null} on update to keep the currently stored key unchanged.
 */
public record AiModelRequest(
        @NotNull AiProvider provider,
        @NotBlank @Size(max = 100) String modelName,
        String apiKey,
        @NotNull @Min(1) Integer maxTokensPerRequest,
        boolean isActive
) {
}
