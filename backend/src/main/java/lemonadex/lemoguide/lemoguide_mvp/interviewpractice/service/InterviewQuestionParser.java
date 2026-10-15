package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.AiReplies;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Normalizes the model's question set: whitelisted categories, capped text, duplicates dropped, at
 * most the requested number. Throws when too few usable questions came back so the runner can retry.
 */
final class InterviewQuestionParser {

    static final Set<String> CATEGORIES = Set.of("intro", "motivation", "behavioral", "technical", "situational");
    private static final int MIN_USABLE = 3;

    record Generated(String category, String question, String intent, String hint) {
    }

    private InterviewQuestionParser() {
    }

    /** @throws IllegalArgumentException when fewer than min(3, count) usable questions are present */
    static List<Generated> parse(ObjectMapper mapper, String raw, int count) {
        Iterable<JsonNode> nodes;
        try {
            nodes = AiReplies.array(AiReplies.jsonObject(mapper, raw), "questions");
        } catch (IllegalArgumentException notValidJson) {
            // A reply cut off at the token limit is not valid JSON, but its finished questions are still good.
            nodes = completeQuestionObjects(mapper, raw);
            if (!nodes.iterator().hasNext()) {
                throw notValidJson;
            }
        }
        List<Generated> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (JsonNode node : nodes) {
            String question = AiReplies.text(node, "question", 600);
            if (question == null || out.size() >= count || !seen.add(question.toLowerCase(Locale.ROOT))) {
                continue;
            }
            String category = AiReplies.text(node, "category", 20);
            category = category != null && CATEGORIES.contains(category.toLowerCase(Locale.ROOT))
                    ? category.toLowerCase(Locale.ROOT) : "behavioral";
            out.add(new Generated(category, question, AiReplies.text(node, "intent", 500), AiReplies.text(node, "hint", 600)));
        }
        if (out.size() < Math.min(MIN_USABLE, count)) {
            throw new IllegalArgumentException("Reply has too few usable interview questions");
        }
        return out;
    }

    /**
     * The objects of the "questions" array that were written out completely in a reply that may be cut off
     * mid-way. Scans braces while ignoring the ones inside strings, so a question containing "{" is safe.
     */
    private static List<JsonNode> completeQuestionObjects(ObjectMapper mapper, String raw) {
        List<JsonNode> objects = new ArrayList<>();
        if (raw == null) {
            return objects;
        }
        int key = raw.indexOf("\"questions\"");
        int start = key < 0 ? -1 : raw.indexOf('[', key);
        if (start < 0) {
            return objects;
        }
        int depth = 0;
        int objectStart = -1;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start + 1; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    inString = false;
                }
            } else if (c == '"') {
                inString = true;
            } else if (c == '{') {
                if (depth++ == 0) {
                    objectStart = i;
                }
            } else if (c == '}' && depth > 0 && --depth == 0) {
                try {
                    JsonNode node = mapper.readTree(raw.substring(objectStart, i + 1));
                    if (node.isObject()) {
                        objects.add(node);
                    }
                } catch (Exception ignored) {
                    // malformed object: skip it
                }
            } else if (c == ']' && depth == 0) {
                break;
            }
        }
        return objects;
    }
}
