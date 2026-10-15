package lemonadex.lemoguide.lemoguide_mvp.aimessage.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.aimessage.entity.AiMessage;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    Page<AiMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    /** Most recent turns first, for building the model's chat history context. */
    List<AiMessage> findTop20ByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
