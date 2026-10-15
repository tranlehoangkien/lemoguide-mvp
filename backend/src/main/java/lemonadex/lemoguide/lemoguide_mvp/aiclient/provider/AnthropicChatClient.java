package lemonadex.lemoguide.lemoguide_mvp.aiclient.provider;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import tools.jackson.databind.JsonNode;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClient;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatOptions;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** Calls the Anthropic Messages API (system prompt is a top-level field, not a message). */
@Component
public class AnthropicChatClient implements AiChatClient {

    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private final RestClient restClient;

    public AnthropicChatClient(@Value("${app.ai.anthropic.base-url:https://api.anthropic.com/v1}") String baseUrl) {
        this.restClient = RestClient.create(baseUrl);
    }

    @Override
    public AiProvider provider() {
        return AiProvider.ANTHROPIC;
    }

    @Override
    public AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history, AiChatOptions options) {
        List<Map<String, String>> messages = history.stream()
                .map(turn -> Map.of("role", turn.role(), "content", turn.content()))
                .toList();

        Map<String, Object> body = new HashMap<>();
        body.put("model", model.getModelName());
        body.put("system", systemPrompt);
        body.put("max_tokens", model.getMaxTokensPerRequest());
        body.put("messages", messages);
        if (options.temperature() != null) {
            body.put("temperature", options.temperature());
        }

        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/messages")
                    .header("x-api-key", model.getApiKeyEncrypted())
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            throw new AiChatException("Anthropic chat request failed: " + ex.getMessage(), ex);
        }

        if (response == null || !response.path("content").isArray() || response.path("content").isEmpty()) {
            throw new AiChatException("Anthropic returned no content blocks");
        }
        String content = response.path("content").get(0).path("text").asText("");
        int inputTokens = response.path("usage").path("input_tokens").asInt(0);
        int outputTokens = response.path("usage").path("output_tokens").asInt(0);
        return new AiChatResult(content, inputTokens, outputTokens);
    }
}
