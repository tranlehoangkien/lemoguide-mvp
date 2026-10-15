package lemonadex.lemoguide.lemoguide_mvp.aiclient;

import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** One implementation per {@link AiProvider}, calling that vendor's chat/completion API. */
public interface AiChatClient {

    AiProvider provider();

    /**
     * @param model the admin-configured model (name + API key) to call
     * @param systemPrompt the AI Coach persona/instructions for this conversation
     * @param history prior turns, oldest first, ending with the newest user message
     * @param options sampling settings; implementations must ignore what they do not support
     */
    AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history, AiChatOptions options);

    default AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history) {
        return chat(model, systemPrompt, history, AiChatOptions.DEFAULT);
    }
}
