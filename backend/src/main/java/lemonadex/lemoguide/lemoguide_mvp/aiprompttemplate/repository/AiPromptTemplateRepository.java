package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;

public interface AiPromptTemplateRepository
        extends JpaRepository<AiPromptTemplate, Long>, JpaSpecificationExecutor<AiPromptTemplate> {

    boolean existsByModelId(Long modelId);

    List<AiPromptTemplate> findByActionTypeAndIsActiveTrue(ActionType actionType);

    /** The system prompt the AI Coach chat feature runs for a given model. */
    Optional<AiPromptTemplate> findFirstByModelIdAndActionTypeAndIsActiveTrueOrderByVersionDesc(
            Long modelId, ActionType actionType);

    /** Copies every {@code ai_prompt_default} (V53) the model has no template for yet onto that model. */
    @Modifying
    @Query(value = """
            INSERT INTO ai_prompt_template (action_type, model_id, prompt_text, version, is_active, created_by)
            SELECT d.action_type, :modelId, d.prompt_text, 1, TRUE, NULL
            FROM ai_prompt_default d
            WHERE NOT EXISTS (
                SELECT 1 FROM ai_prompt_template t WHERE t.model_id = :modelId AND t.action_type = d.action_type)
            """, nativeQuery = true)
    int seedDefaultsForModel(@Param("modelId") Long modelId);
}
