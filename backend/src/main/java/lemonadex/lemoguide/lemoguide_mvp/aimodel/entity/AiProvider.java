package lemonadex.lemoguide.lemoguide_mvp.aimodel.entity;

/**
 * LLM vendor behind an {@link AiModel}. Persisted lowercase to match the
 * {@code ai_model.provider} MySQL ENUM ('openai','anthropic','google','groq','other')
 * via {@link AiProviderConverter}.
 */
public enum AiProvider {
    OPENAI,
    ANTHROPIC,
    GOOGLE,
    GROQ,
    OTHER
}
