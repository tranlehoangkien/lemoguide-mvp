package lemonadex.lemoguide.lemoguide_mvp.aiclient;

/** One turn of chat history sent to a provider. {@code role} is "user" or "assistant". */
public record AiChatMessage(String role, String content) {
}
