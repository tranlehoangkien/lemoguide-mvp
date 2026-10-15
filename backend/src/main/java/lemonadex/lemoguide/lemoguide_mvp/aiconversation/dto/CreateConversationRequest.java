package lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto;

import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.ConversationCategory;

/**
 * Starts a new conversation. {@code modelId} is optional - leave it {@code
 * null} to let the server pick the first active AI model; pass it to target a
 * specific one (e.g. from an admin/testing client).
 */
public record CreateConversationRequest(
        ConversationCategory category,
        Long modelId,
        @Size(max = 200) String title,
        Long cvProfileId,
        Long jobPostingId,
        Long careerPlanId
) {
}
