package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto.AiCreditTransactionResponse;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.repository.AiCreditTransactionRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lombok.RequiredArgsConstructor;

/** Read-only self-service view of the caller's own AI credit ledger. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MyAiCreditTransactionService {

    private final AiCreditTransactionRepository aiCreditTransactionRepository;

    public Page<AiCreditTransactionResponse> list(Pageable pageable) {
        Long accountId = SecurityUtils.currentAccountId();
        return aiCreditTransactionRepository.findByAccountId(accountId, pageable).map(AiCreditTransactionResponse::from);
    }
}
