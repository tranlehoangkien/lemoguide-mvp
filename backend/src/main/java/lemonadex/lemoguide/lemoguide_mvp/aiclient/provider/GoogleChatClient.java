package lemonadex.lemoguide.lemoguide_mvp.aiclient.provider;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClient;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatOptions;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/**
 * Calls the Gemini {@code generateContent} API. Google's turn roles are
 * "user"/"model" rather than the "user"/"assistant" used elsewhere, and the
 * API key is a query parameter rather than a header.
 */
@Component
public class GoogleChatClient implements AiChatClient {

    private final RestClient restClient = RestClient.create("https://generativelanguage.googleapis.com/v1beta");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AiProvider provider() {
        return AiProvider.GOOGLE;
    }

    @Override
    public AiChatResult chat(AiModel model, String systemPrompt, List<AiChatMessage> history, AiChatOptions options) {
        List<Map<String, Object>> contents = history.stream()
                .map(turn -> Map.<String, Object>of(
                        "role", "assistant".equals(turn.role()) ? "model" : "user",
                        "parts", List.of(Map.of("text", turn.content()))))
                .toList();

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", model.getMaxTokensPerRequest());
        if (options.temperature() != null) {
            generationConfig.put("temperature", options.temperature());
        }
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", contents,
                "generationConfig", generationConfig);

        JsonNode response;
        try {
            response = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/{model}:generateContent")
                            .queryParam("key", model.getApiKeyEncrypted())
                            .build(model.getModelName()))
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            throw new AiChatException("Google chat request failed: " + extractErrorMessage(ex), ex);
        }

        JsonNode candidates = response == null ? null : response.path("candidates");
        if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
            throw new AiChatException("Google returned no candidates");
        }
        JsonNode firstCandidate = candidates.get(0);
        String content = firstCandidate.path("content").path("parts").path(0).path("text").asText("");
        if (content.isBlank()) {
            // Most common cause for a "thinking" model (e.g. gemini-*-flash/pro with
            // reasoning enabled): it spends the whole maxOutputTokens budget on hidden
            // reasoning tokens before ever emitting a visible text part, so the API call
            // "succeeds" with candidates present but no text - finishReason is usually
            // MAX_TOKENS in that case. Without this check the caller would silently save
            // an empty assistant message (no visible answer, no error) instead of
            // surfacing a retryable failure.
            String finishReason = firstCandidate.path("finishReason").asText("UNKNOWN");
            throw new AiChatException("Google returned an empty response (finishReason=" + finishReason
                    + "); if this is MAX_TOKENS on a thinking-enabled model, raise max_tokens_per_request"
                    + " for this model or disable thinking");
        }
        int inputTokens = response.path("usageMetadata").path("promptTokenCount").asInt(0);
        int outputTokens = response.path("usageMetadata").path("candidatesTokenCount").asInt(0);
        return new AiChatResult(content, inputTokens, outputTokens);
    }

    /**
     * Google's error responses are a full JSON body (status/quota
     * links/retry info...) that can easily run past a few hundred
     * characters - {@code ex.getMessage()} on a Spring HTTP exception embeds
     * that whole body. Pull out just {@code error.message} when the
     * response is JSON so the wrapped {@link AiChatException} (which ends up
     * persisted to a bounded DB column, see {@code AiGenerationLogService})
     * stays short and readable; fall back to the raw message otherwise.
     */
    private String extractErrorMessage(RestClientException ex) {
        if (ex instanceof RestClientResponseException responseEx) {
            String responseBody = responseEx.getResponseBodyAsString();
            if (responseBody != null && !responseBody.isBlank()) {
                try {
                    JsonNode errorMessage = objectMapper.readTree(responseBody).path("error").path("message");
                    if (!errorMessage.isMissingNode() && !errorMessage.asText("").isBlank()) {
                        return responseEx.getStatusCode() + " " + errorMessage.asText();
                    }
                } catch (Exception parseEx) {
                    // Not JSON, or not in the expected shape - fall through to the raw message below.
                }
            }
        }
        return ex.getMessage();
    }
}
