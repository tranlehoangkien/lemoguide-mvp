package lemonadex.lemoguide.lemoguide_mvp.aiclient.provider;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;

/** Reasoning models must not burn the whole token budget on hidden reasoning; other models are left alone. */
class GroqChatClientTest {

    private final GroqChatClient client = new GroqChatClient();

    @Test
    void gptOssModelsGetLowReasoningEffort() {
        Map<String, Object> body = new HashMap<>();
        client.customizeBody(AiModel.builder().modelName("openai/gpt-oss-120b").build(), body);
        assertThat(body).containsEntry("reasoning_effort", "low");
    }

    @Test
    void otherModelsAreUnchanged() {
        Map<String, Object> body = new HashMap<>();
        client.customizeBody(AiModel.builder().modelName("llama-3.3-70b-versatile").build(), body);
        assertThat(body).isEmpty();
    }
}
