package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity.AiCreditTransaction;

public interface AiCreditTransactionRepository
        extends JpaRepository<AiCreditTransaction, Long>, JpaSpecificationExecutor<AiCreditTransaction> {

    Page<AiCreditTransaction> findByAccountId(Long accountId, Pageable pageable);

    Optional<AiCreditTransaction> findByIdAndAccountId(Long id, Long accountId);
}
