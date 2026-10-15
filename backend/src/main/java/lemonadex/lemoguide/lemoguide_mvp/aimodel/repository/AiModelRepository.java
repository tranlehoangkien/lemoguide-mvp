package lemonadex.lemoguide.lemoguide_mvp.aimodel.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

public interface AiModelRepository extends JpaRepository<AiModel, Long>, JpaSpecificationExecutor<AiModel> {

    boolean existsByProviderAndModelNameIgnoreCase(AiProvider provider, String modelName);

    Optional<AiModel> findByProviderAndModelNameIgnoreCase(AiProvider provider, String modelName);

    /** Fallback model for a new conversation when the caller doesn't request a specific one. */
    Optional<AiModel> findFirstByIsActiveTrueOrderByIdAsc();

    /** Used by job analysis to find the first active model that has an {@code analyze_job} prompt. */
    java.util.List<AiModel> findByIsActiveTrueOrderByIdAsc();
}
