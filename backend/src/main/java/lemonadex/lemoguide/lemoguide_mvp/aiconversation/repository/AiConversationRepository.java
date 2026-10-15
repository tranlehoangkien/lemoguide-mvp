package lemonadex.lemoguide.lemoguide_mvp.aiconversation.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.AiConversation;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.ConversationCategory;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true, clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("update AiConversation c set c.careerPlanId = null where c.careerPlanId = :planId")
    void detachCareerPlan(Long planId);

    Page<AiConversation> findByAccountIdAndDeletedAtIsNull(Long accountId, Pageable pageable);

    Page<AiConversation> findByAccountIdAndCategoryAndDeletedAtIsNull(
            Long accountId, ConversationCategory category, Pageable pageable);

    Optional<AiConversation> findByIdAndAccountIdAndDeletedAtIsNull(Long id, Long accountId);
}
