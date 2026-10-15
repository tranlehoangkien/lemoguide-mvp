package lemonadex.lemoguide.lemoguide_mvp.aiclient.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

@Component
public class OpenAiChatClient extends OpenAiCompatibleChatClient {

    public OpenAiChatClient(@Value("${app.ai.openai.base-url:https://api.openai.com/v1}") String baseUrl) {
        super(baseUrl);
    }

    @Override
    public AiProvider provider() {
        return AiProvider.OPENAI;
    }
}
