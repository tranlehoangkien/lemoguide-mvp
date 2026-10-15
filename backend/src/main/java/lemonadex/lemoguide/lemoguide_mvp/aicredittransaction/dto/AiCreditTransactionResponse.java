package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity.AiCreditTransaction;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity.CreditReason;

public record AiCreditTransactionResponse(
        Long id,
        Long accountId,
        Integer amount,
        CreditReason reason,
        Long relatedGenerationLogId,
        LocalDateTime createdAt
) {

    public static AiCreditTransactionResponse from(AiCreditTransaction t) {
        return new AiCreditTransactionResponse(t.getId(), t.getAccountId(), t.getAmount(), t.getReason(),
                t.getRelatedGenerationLogId(), t.getCreatedAt());
    }
}
