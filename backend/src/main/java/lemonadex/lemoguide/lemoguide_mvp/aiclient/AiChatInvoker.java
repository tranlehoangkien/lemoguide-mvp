package lemonadex.lemoguide.lemoguide_mvp.aiclient;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lombok.RequiredArgsConstructor;

/**
 * Calls a model's provider with the retry policy every AI feature shares
 * (AI Coach chat, job analysis...). Extracted from {@code MyAiConversationService}
 * so a second caller does not need its own copy.
 *
 * <p>Retries once after a short delay on failure. An overload error (e.g. Google's Gemini API
 * returning a 503 "model is currently experiencing high demand" during a load spike) usually
 * outlasts a sub-second retry, so {@link #isTransient transient} errors get up to
 * {@link #MAX_TRANSIENT_ATTEMPTS} attempts with a growing backoff instead; still bounded, so no
 * retry storm.
 * {@link #requireContent} makes an empty answer count as a failure too, so it
 * gets the same one retry as any other error instead of silently reaching the
 * caller as a "successful" empty message.
 *
 * <p>A rate-limit error (HTTP 429) that says when to come back ("Please try again in 14.475s", the wording
 * Groq uses) is retried after exactly that wait, up to {@link #MAX_RATE_LIMIT_WAIT_MS}: waiting 0.8s would
 * just hit the same limit again.
 */
@Component
@RequiredArgsConstructor
public class AiChatInvoker {

    private static final long RETRY_DELAY_MS = 800;
    static final int MAX_TRANSIENT_ATTEMPTS = 3;
    /** Backoff before the 2nd and 3rd attempt of a transient failure. */
    private static final long[] TRANSIENT_BACKOFF_MS = {1_500, 4_000};
    static final long MAX_RATE_LIMIT_WAIT_MS = 20_000;
    private static final Pattern TRY_AGAIN_IN = Pattern.compile("(?:try again|retry) in (?:(\\d+)m)?\\s*(\\d+(?:\\.\\d+)?)s",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern TRANSIENT_STATUS = Pattern.compile("\\b(429|500|502|503|504|529)\\b");

    private final AiChatClientRegistry aiChatClientRegistry;

    public AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history) {
        return chat(model, systemPrompt, history, AiChatOptions.DEFAULT);
    }

    public AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history, AiChatOptions options) {
        AiChatClient client = aiChatClientRegistry.resolve(model.getProvider());
        AiChatOptions current = options;
        for (int attempt = 1; ; attempt++) {
            try {
                return requireContent(client.chat(model, systemPrompt, history, current));
            } catch (RuntimeException ex) {
                int maxAttempts = isTransient(ex) ? MAX_TRANSIENT_ATTEMPTS : 2;
                if (attempt >= maxAttempts) {
                    throw ex;
                }
                try {
                    Thread.sleep(retryDelayMillis(ex, attempt));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ex;
                }
                // Some models (OpenAI's reasoning models, for one) answer 400 to any temperature but their own:
                // the retry then goes without it rather than failing the whole feature for that model.
                if (rejectsTemperature(ex)) {
                    current = current.withoutTemperature();
                }
            }
        }
    }

    /**
     * Errors worth waiting out: provider overload/outage (5xx, "high demand", "overloaded", "UNAVAILABLE"),
     * rate limits, timeouts and empty answers. Auth or bad-request errors are not: they fail the same way again.
     */
    public static boolean isTransient(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            if (t instanceof java.net.SocketTimeoutException || t instanceof java.net.http.HttpTimeoutException
                    || t instanceof org.springframework.web.client.ResourceAccessException) {
                return true;
            }
            String message = t.getMessage();
            if (message == null) {
                continue;
            }
            String lower = message.toLowerCase();
            if (TRANSIENT_STATUS.matcher(lower).find() || lower.contains("unavailable")
                    || lower.contains("high demand") || lower.contains("overloaded") || lower.contains("rate limit")
                    || lower.contains("timed out") || lower.contains("timeout") || lower.contains("empty response")) {
                return true;
            }
        }
        return false;
    }

    static boolean rejectsTemperature(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message != null && message.toLowerCase().contains("temperature")) {
                return true;
            }
        }
        return false;
    }

    static long retryDelayMillis(Throwable error) {
        return retryDelayMillis(error, 1);
    }

    /**
     * How long to wait before the next attempt: the provider's own "try again in Xs" when the error carries one
     * that is short enough to be worth waiting for, a growing backoff for other transient errors, otherwise the
     * short default.
     */
    static long retryDelayMillis(Throwable error, int failedAttempt) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            String message = t.getMessage();
            if (message == null) {
                continue;
            }
            Matcher m = TRY_AGAIN_IN.matcher(message);
            if (m.find()) {
                long minutes = m.group(1) == null ? 0 : Long.parseLong(m.group(1));
                long millis = (long) ((minutes * 60 + Double.parseDouble(m.group(2))) * 1000) + 500;
                return millis <= MAX_RATE_LIMIT_WAIT_MS ? millis : RETRY_DELAY_MS;
            }
        }
        if (isTransient(error)) {
            return TRANSIENT_BACKOFF_MS[Math.min(failedAttempt, TRANSIENT_BACKOFF_MS.length) - 1];
        }
        return RETRY_DELAY_MS;
    }

    /**
     * A provider call can return 200 OK with well-formed JSON yet still carry
     * no visible answer - e.g. a safety block, or a thinking-enabled Gemini
     * model spending its whole token budget on hidden reasoning before ever
     * emitting a text part (see the comment in {@code GoogleChatClient}).
     * Treating that as a failure here (rather than in each provider client)
     * catches it uniformly for every provider.
     */
    private AiChatResult requireContent(AiChatResult result) {
        if (result.content() == null || result.content().isBlank()) {
            throw new AiChatException("AI provider returned an empty response");
        }
        return result;
    }
}
