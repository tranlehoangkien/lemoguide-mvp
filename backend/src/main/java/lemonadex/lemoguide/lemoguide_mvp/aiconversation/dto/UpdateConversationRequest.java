package lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto;

import jakarta.validation.constraints.Size;

/** Partial update: only non-null fields are applied (rename, pin/unpin, and/or switch model). */
public record UpdateConversationRequest(
        @Size(max = 200) String title,
        Boolean isPinned,
        Long modelId
) {
}
