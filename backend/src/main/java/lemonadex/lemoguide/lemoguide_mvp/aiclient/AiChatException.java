package lemonadex.lemoguide.lemoguide_mvp.aiclient;

/** Wraps any failure talking to an AI provider (network, auth, malformed response, ...). */
public class AiChatException extends RuntimeException {

    public AiChatException(String message, Throwable cause) {
        super(message, cause);
    }

    public AiChatException(String message) {
        super(message);
    }
}
