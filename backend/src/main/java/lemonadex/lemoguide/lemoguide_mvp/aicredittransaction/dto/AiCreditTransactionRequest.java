package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto;

import jakarta.validation.constraints.NotNull;

import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity.CreditReason;

/**
 * Create / replace payload for an {@code ai_credit_transaction}. In normal
 * operation these rows are written by the credit-spending/refill logic right
 * alongside {@code account.ai_credits_remaining}, not typed in by hand; the
 * admin CRUD here exists mainly to grant a manual credit adjustment or correct
 * a bad entry.
 */
public record AiCreditTransactionRequest(
        @NotNull Long accountId,
        @NotNull Integer amount,
        @NotNull CreditReason reason,
        Long relatedGenerationLogId
) {
}
