package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity;

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
 * A versioned system prompt for one AI action, run against one {@code ai_model}.
 * Mapped to the {@code ai_prompt_template} table from
 * {@code V6__add_cv_ai_management.sql}.
 */
@Entity
@Table(name = "ai_prompt_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPromptTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = ActionTypeConverter.class)
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    /** Plain id into {@code ai_model}. */
    @Column(name = "model_id", nullable = false)
    private Long modelId;

    @Column(name = "prompt_text", nullable = false, columnDefinition = "TEXT")
    private String promptText;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** Plain id into {@code account} (the admin who created this template). */
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
