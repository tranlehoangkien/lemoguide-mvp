package lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto;

import lemonadex.lemoguide.lemoguide_mvp.aimessage.dto.AiMessageResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;

/** A conversation plus one page of its messages, oldest first. */
public record AiConversationDetailResponse(
        AiConversationResponse conversation,
        PageResponse<AiMessageResponse> messages
) {
}
