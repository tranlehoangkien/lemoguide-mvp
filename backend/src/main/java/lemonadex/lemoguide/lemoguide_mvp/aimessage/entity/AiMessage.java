package lemonadex.lemoguide.lemoguide_mvp.aimessage.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One turn (user or assistant) inside an {@code ai_conversation}. Mapped to
 * the {@code ai_message} table from {@code V7__add_ai_chat_conversation.sql}.
 */
@Entity
@Table(name = "ai_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Convert(converter = MessageRoleConverter.class)
    @Column(nullable = false, length = 10)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    /** Set when {@link #role} = ASSISTANT; links to the {@code ai_generation_log} row for this reply. */
    @Column(name = "generation_log_id")
    private Long generationLogId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
