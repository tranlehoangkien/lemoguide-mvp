package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.AiGenerationLog;

public interface AiGenerationLogRepository
        extends JpaRepository<AiGenerationLog, Long>, JpaSpecificationExecutor<AiGenerationLog> {

    boolean existsByPromptTemplateId(Long promptTemplateId);

    Page<AiGenerationLog> findByAccountId(Long accountId, Pageable pageable);

    Optional<AiGenerationLog> findByIdAndAccountId(Long id, Long accountId);
}
