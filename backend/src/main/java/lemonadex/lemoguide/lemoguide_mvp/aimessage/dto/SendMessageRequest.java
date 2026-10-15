package lemonadex.lemoguide.lemoguide_mvp.aimessage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload for posting one user turn into a conversation.
 *
 * @param context optional caller-supplied context (e.g. the current CV as
 *                JSON) injected into the system prompt for this turn only -
 *                never persisted as message content. See
 *                {@code MyAiConversationService#sendMessage} for how it is
 *                combined with the model's base prompt template.
 */
public record SendMessageRequest(
        @NotBlank @Size(max = 8000) String content,
        @Size(max = 500) String attachmentUrl,
        @Size(max = 16000) String context
) {
}
