package lemonadex.lemoguide.lemoguide_mvp.aimodel.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An admin-configured AI provider + model, e.g. Anthropic / claude-sonnet-4-6.
 * Mapped to the {@code ai_model} table from
 * {@code V6__add_cv_ai_management.sql}. {@link #apiKeyEncrypted} is a secret and
 * must never be serialized as-is; see {@code AiModelResponse}, which exposes
 * only a boolean flag instead.
 */
@Entity
@Table(name = "ai_model")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = AiProviderConverter.class)
    @Column(nullable = false, length = 20)
    private AiProvider provider;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "api_key_encrypted", nullable = false, length = 500)
    private String apiKeyEncrypted;

    @Column(name = "max_tokens_per_request", nullable = false)
    @Builder.Default
    private Integer maxTokensPerRequest = 4096;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
