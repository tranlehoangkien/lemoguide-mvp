package lemonadex.lemoguide.lemoguide_mvp.aiclient;

/**
 * Per-call sampling settings. A {@code null} temperature leaves the provider's own default in place,
 * which is what free-form chat and writing want; tasks that produce a score use {@link #SCORING} so the
 * same input gives (nearly) the same answer instead of a fresh random draw every time.
 */
public record AiChatOptions(Double temperature) {

    /** Provider defaults. */
    public static final AiChatOptions DEFAULT = new AiChatOptions(null);

    /** Low but not zero: 0 makes some providers loop or repeat, 0.1 is stable enough for a rubric. */
    public static final AiChatOptions SCORING = new AiChatOptions(0.1);

    /** Same options minus the temperature, for a model that rejects the parameter. */
    public AiChatOptions withoutTemperature() {
        return DEFAULT;
    }
}
