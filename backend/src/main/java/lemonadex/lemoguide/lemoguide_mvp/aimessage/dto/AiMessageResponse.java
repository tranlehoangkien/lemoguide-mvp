package lemonadex.lemoguide.lemoguide_mvp.aimessage.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.aimessage.entity.AiMessage;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.entity.MessageRole;

public record AiMessageResponse(
        Long id,
        Long conversationId,
        MessageRole role,
        String content,
        String attachmentUrl,
        Long generationLogId,
        LocalDateTime createdAt
) {

    public static AiMessageResponse from(AiMessage m) {
        return new AiMessageResponse(m.getId(), m.getConversationId(), m.getRole(), m.getContent(),
                m.getAttachmentUrl(), m.getGenerationLogId(), m.getCreatedAt());
    }
}
