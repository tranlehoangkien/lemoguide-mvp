package lemonadex.lemoguide.lemoguide_mvp.aiclient;

/** The assistant's reply plus the token usage the provider reported for it. */
public record AiChatResult(String content, int inputTokens, int outputTokens) {
}
