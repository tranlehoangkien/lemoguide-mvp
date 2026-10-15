package lemonadex.lemoguide.lemoguide_mvp.aiclient;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** A provider that says when to come back is retried after that wait, not after the short default. */
class AiChatInvokerTest {

    private static final String GROQ_429 = "GROQ chat request failed: 429 Too Many Requests: \"{\\\"error\\\":{\\\"message\\\":"
            + "\\\"Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 8000, Used 7154, "
            + "Requested 2776. Please try again in 14.475s. Need more tokens?\\\"}}\"";

    @Test
    void waitsForTheProvidersRetryAfterPlusAMargin() {
        assertThat(AiChatInvoker.retryDelayMillis(new AiChatException(GROQ_429))).isEqualTo(14_975);
        assertThat(AiChatInvoker.retryDelayMillis(new RuntimeException("wrapper", new AiChatException(GROQ_429))))
                .isEqualTo(14_975);
        assertThat(AiChatInvoker.retryDelayMillis(new AiChatException("Please try again in 1m2.5s."))).isEqualTo(800); // over a minute: not worth waiting
    }

    @Test
    void recognisesAModelThatRejectsTheTemperatureParameter() {
        assertThat(AiChatInvoker.rejectsTemperature(new AiChatException(
                "OPENAI chat request failed: 400 Bad Request: Unsupported value: 'temperature' does not support 0.1"))).isTrue();
        assertThat(AiChatInvoker.rejectsTemperature(new RuntimeException("wrapper", new AiChatException("Temperature is fixed")))).isTrue();
        assertThat(AiChatInvoker.rejectsTemperature(new AiChatException("503 model is overloaded"))).isFalse();
        assertThat(AiChatInvoker.rejectsTemperature(new RuntimeException((String) null))).isFalse();
    }

    @Test
    void readsGooglesRetryInWording() {
        assertThat(AiChatInvoker.retryDelayMillis(new AiChatException(
                "Google chat request failed: 429 TOO_MANY_REQUESTS You exceeded your current quota. Please retry in 9.5s.")))
                .isEqualTo(10_000);
    }

    @Test
    void overloadErrorsAreTransientAndBackOffLonger() {
        AiChatException overload = new AiChatException("Google chat request failed: 503 SERVICE_UNAVAILABLE "
                + "This model is currently experiencing high demand.");
        assertThat(AiChatInvoker.isTransient(overload)).isTrue();
        assertThat(AiChatInvoker.isTransient(new AiChatException("AI provider returned an empty response"))).isTrue();
        assertThat(AiChatInvoker.isTransient(new AiChatException("401 Unauthorized: invalid API key"))).isFalse();
        assertThat(AiChatInvoker.isTransient(new AiChatException("boom"))).isFalse();
        assertThat(AiChatInvoker.retryDelayMillis(overload, 1)).isEqualTo(1_500);
        assertThat(AiChatInvoker.retryDelayMillis(overload, 2)).isEqualTo(4_000);
    }

    @Test
    void fallsBackToTheShortDelayForEverythingElse() {
        assertThat(AiChatInvoker.retryDelayMillis(new AiChatException("Please try again in 45s"))).isEqualTo(800); // too long to wait for
        assertThat(AiChatInvoker.retryDelayMillis(new RuntimeException((String) null))).isEqualTo(800);
    }
}
