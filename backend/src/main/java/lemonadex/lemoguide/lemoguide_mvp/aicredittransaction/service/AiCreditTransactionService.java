package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto.AiCreditTransactionRequest;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto.AiCreditTransactionResponse;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity.AiCreditTransaction;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.repository.AiCreditTransactionRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

/**
 * Admin CRUD for the {@code ai_credit_transaction} ledger. Every write here also
 * keeps {@code account.ai_credits_remaining} in sync with the sum of its
 * transactions, so the ledger and the balance never drift apart.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AiCreditTransactionService {

    private final AiCreditTransactionRepository aiCreditTransactionRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public Page<AiCreditTransactionResponse> search(Long accountId, Pageable pageable) {
        Page<AiCreditTransaction> page = accountId != null
                ? aiCreditTransactionRepository.findByAccountId(accountId, pageable)
                : aiCreditTransactionRepository.findAll(pageable);
        return page.map(AiCreditTransactionResponse::from);
    }

    @Transactional(readOnly = true)
    public AiCreditTransactionResponse get(Long id) {
        return AiCreditTransactionResponse.from(require(id));
    }

    public AiCreditTransactionResponse create(AiCreditTransactionRequest request) {
        Account account = requireAccount(request.accountId());
        AiCreditTransaction transaction = aiCreditTransactionRepository.save(AiCreditTransaction.builder()
                .accountId(request.accountId())
                .amount(request.amount())
                .reason(request.reason())
                .relatedGenerationLogId(request.relatedGenerationLogId())
                .build());
        applyBalanceDelta(account, request.amount());
        return AiCreditTransactionResponse.from(transaction);
    }

    /** Reverses the old amount off the balance, then applies the new one. */
    public AiCreditTransactionResponse update(Long id, AiCreditTransactionRequest request) {
        AiCreditTransaction transaction = require(id);
        Account oldAccount = requireAccount(transaction.getAccountId());
        applyBalanceDelta(oldAccount, -transaction.getAmount());

        Account newAccount = requireAccount(request.accountId());
        transaction.setAccountId(request.accountId());
        transaction.setAmount(request.amount());
        transaction.setReason(request.reason());
        transaction.setRelatedGenerationLogId(request.relatedGenerationLogId());
        applyBalanceDelta(newAccount, request.amount());

        return AiCreditTransactionResponse.from(transaction);
    }

    /** Reverses the transaction's amount off the balance before removing it. */
    public void delete(Long id) {
        AiCreditTransaction transaction = require(id);
        Account account = requireAccount(transaction.getAccountId());
        applyBalanceDelta(account, -transaction.getAmount());
        aiCreditTransactionRepository.delete(transaction);
    }

    private void applyBalanceDelta(Account account, int delta) {
        account.setAiCreditsRemaining(Math.max(0, account.getAiCreditsRemaining() + delta));
    }

    private Account requireAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Account does not exist"));
    }

    private AiCreditTransaction require(Long id) {
        return aiCreditTransactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Credit transaction not found"));
    }
}
