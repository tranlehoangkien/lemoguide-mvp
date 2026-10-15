package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity;

import java.math.BigDecimal;
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

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionTypeConverter;

/**
 * An audit record of one AI call (usage + cost + debugging). Mapped to the
 * {@code ai_generation_log} table from {@code V6__add_cv_ai_management.sql}.
 */
@Entity
@Table(name = "ai_generation_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiGenerationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "cv_profile_id")
    private Long cvProfileId;

    @Column(name = "prompt_template_id", nullable = false)
    private Long promptTemplateId;

    @Convert(converter = ActionTypeConverter.class)
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    @Column(name = "input_summary", columnDefinition = "TEXT")
    private String inputSummary;

    @Column(name = "output_summary", columnDefinition = "TEXT")
    private String outputSummary;

    @Column(name = "input_tokens", nullable = false)
    @Builder.Default
    private Integer inputTokens = 0;

    @Column(name = "output_tokens", nullable = false)
    @Builder.Default
    private Integer outputTokens = 0;

    @Column(nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal cost = BigDecimal.ZERO;

    @Convert(converter = GenerationStatusConverter.class)
    @Column(nullable = false, length = 10)
    private GenerationStatus status;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
