package lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity;

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
 * One AI Coach chat thread. Mapped to the {@code ai_conversation} table from
 * {@code V7__add_ai_chat_conversation.sql}.
 */
@Entity
@Table(name = "ai_conversation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    /** Plain id into {@code ai_model}: which model answers this conversation. */
    @Column(name = "model_id", nullable = false)
    private Long modelId;

    @Convert(converter = ConversationCategoryConverter.class)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ConversationCategory category = ConversationCategory.GENERAL;

    /**
     * Optional grounding for the "Toi uu CV/Thu xin viec" topic: the CV (and job) this
     * chat is about. The server builds the prompt context from them, see
     * {@code CvGroundingService}. Plain ids, ownership is checked at creation.
     */
    @Column(name = "cv_profile_id")
    private Long cvProfileId;

    @Column(name = "job_posting_id")
    private Long jobPostingId;

    @Column(name = "career_plan_id")
    private Long careerPlanId;

    @Column(length = 200)
    private String title;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
