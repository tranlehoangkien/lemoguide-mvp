package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity;

/**
 * Why an {@link AiCreditTransaction} happened. Persisted lowercase to match the
 * {@code ai_credit_transaction.reason} MySQL ENUM ('used','purchased',
 * 'monthly_reset','refund') via {@link CreditReasonConverter}.
 */
public enum CreditReason {
    USED,
    PURCHASED,
    MONTHLY_RESET,
    REFUND
}
