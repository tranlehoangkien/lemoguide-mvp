package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity;

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
 * One entry in an account's AI credit ledger. Mapped to the
 * {@code ai_credit_transaction} table from
 * {@code V6__add_cv_ai_management.sql}.
 */
@Entity
@Table(name = "ai_credit_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiCreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    /** Negative = used, positive = added. */
    @Column(nullable = false)
    private Integer amount;

    @Convert(converter = CreditReasonConverter.class)
    @Column(nullable = false, length = 20)
    private CreditReason reason;

    @Column(name = "related_generation_log_id")
    private Long relatedGenerationLogId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
