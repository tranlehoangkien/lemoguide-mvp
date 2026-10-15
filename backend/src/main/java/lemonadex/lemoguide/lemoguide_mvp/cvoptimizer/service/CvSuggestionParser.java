package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Reads the model's rewrite suggestions into raw records. Whether a suggestion is acceptable (ref exists,
 * field is editable, text really differs) is decided afterwards by {@code CvSuggestService}, which knows
 * the CV; this only requires the reply to have the expected shape so a malformed one gets retried.
 */
final class CvSuggestionParser {

    static final int MAX_SUGGESTIONS = 8;
    static final int MAX_QUESTIONS = 5;

    private CvSuggestionParser() {
    }

    record Raw(String ref, String field, String after, String reason) {
    }

    record Parsed(List<Raw> suggestions, List<String> questions) {
    }

    /** @throws IllegalArgumentException when the reply has neither a "suggestions" nor a "questions" array */
    static Parsed parse(ObjectMapper mapper, String raw) {
        JsonNode root = AiReplies.jsonObject(mapper, raw);
        if (!AiReplies.hasArray(root, "suggestions") && !AiReplies.hasArray(root, "questions")) {
            throw new IllegalArgumentException("Reply has no suggestions");
        }
        List<Raw> suggestions = new ArrayList<>();
        for (JsonNode node : AiReplies.array(root, "suggestions")) {
            String ref = AiReplies.text(node, "ref", 80);
            String field = AiReplies.text(node, "field", 40);
            String after = AiReplies.text(node, "after", 4000);
            if (ref != null && field != null && after != null && suggestions.size() < MAX_SUGGESTIONS) {
                suggestions.add(new Raw(ref, field, after, AiReplies.text(node, "reason", 400)));
            }
        }
        return new Parsed(suggestions, AiReplies.strings(root, "questions", MAX_QUESTIONS, 300));
    }
}
