package lemonadex.lemoguide.lemoguide_mvp.aiclient.provider;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import tools.jackson.databind.JsonNode;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClient;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatOptions;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;

/**
 * Base for any provider exposing an OpenAI-compatible {@code /chat/completions}
 * endpoint (OpenAI itself, and Groq). Only the base URL and provider tag
 * differ between them.
 */
abstract class OpenAiCompatibleChatClient implements AiChatClient {

    private final RestClient restClient;

    protected OpenAiCompatibleChatClient(String baseUrl) {
        this.restClient = RestClient.create(baseUrl);
    }

    /** Hook for provider-specific request parameters; the default adds nothing. */
    protected void customizeBody(AiModel model, Map<String, Object> body) {
    }

    @Override
    public AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history, AiChatOptions options) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        for (AiChatMessage turn : history) {
            messages.add(Map.of("role", turn.role(), "content", turn.content()));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model.getModelName());
        body.put("messages", messages);
        body.put("max_tokens", model.getMaxTokensPerRequest());
        if (options.temperature() != null) {
            body.put("temperature", options.temperature());
        }
        customizeBody(model, body);

        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + model.getApiKeyEncrypted())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            throw new AiChatException(provider() + " chat request failed: " + ex.getMessage(), ex);
        }

        if (response == null || !response.path("choices").isArray() || response.path("choices").isEmpty()) {
            throw new AiChatException(provider() + " returned no completion choices");
        }
        String content = response.path("choices").get(0).path("message").path("content").asText("");
        int inputTokens = response.path("usage").path("prompt_tokens").asInt(0);
        int outputTokens = response.path("usage").path("completion_tokens").asInt(0);
        return new AiChatResult(content, inputTokens, outputTokens);
    }
}
