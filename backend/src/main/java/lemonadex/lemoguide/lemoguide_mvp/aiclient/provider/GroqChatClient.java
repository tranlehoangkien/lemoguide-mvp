package lemonadex.lemoguide.lemoguide_mvp.aiclient.provider;

import java.util.Map;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** Groq exposes an OpenAI-compatible chat/completions endpoint. */
@Component
public class GroqChatClient extends OpenAiCompatibleChatClient {

    public GroqChatClient() {
        super("https://api.groq.com/openai/v1");
    }

    /**
     * gpt-oss models are reasoning models: at the default effort they can spend the whole
     * {@code max_tokens} budget on hidden reasoning and answer with nothing (an "empty response"), or get cut
     * off in the middle of a JSON answer. Low effort keeps the budget for the visible answer.
     */
    @Override
    protected void customizeBody(AiModel model, Map<String, Object> body) {
        if (model.getModelName() != null && model.getModelName().toLowerCase().contains("gpt-oss")) {
            body.put("reasoning_effort", "low");
        }
    }

    @Override
    public AiProvider provider() {
        return AiProvider.GROQ;
    }
}
