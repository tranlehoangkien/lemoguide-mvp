package lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.AiConversation;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.ConversationCategory;

public record AiConversationResponse(
        Long id,
        Long modelId,
        ConversationCategory category,
        String title,
        Long cvProfileId,
        Long jobPostingId,
        Long careerPlanId,
        boolean isPinned,
        LocalDateTime lastMessageAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static AiConversationResponse from(AiConversation c) {
        return new AiConversationResponse(c.getId(), c.getModelId(), c.getCategory(), c.getTitle(),
                c.getCvProfileId(), c.getJobPostingId(), c.getCareerPlanId(), c.getIsPinned(), c.getLastMessageAt(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
