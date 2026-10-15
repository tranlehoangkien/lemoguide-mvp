package lemonadex.lemoguide.lemoguide_mvp.aimessage.dto;

/** Result of posting one user turn: both saved messages plus the caller's new credit balance. */
public record SendMessageResponse(
        AiMessageResponse userMessage,
        AiMessageResponse assistantMessage,
        Integer aiCreditsRemaining
) {
}
