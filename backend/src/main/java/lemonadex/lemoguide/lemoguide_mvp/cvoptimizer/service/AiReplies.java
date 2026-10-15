package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Small helpers shared by the tolerant parsers of model replies: fenced/embedded JSON, capped text. */
public final class AiReplies {

    private static final Pattern FENCED = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private static final Pattern DIGITS = Pattern.compile("\\d{1,3}");

    private AiReplies() {
    }

    /** The JSON object in a reply, whether bare, in a code fence, or surrounded by prose. */
    public static JsonNode jsonObject(ObjectMapper mapper, String raw) {
        String text = raw == null ? "" : raw.trim();
        String candidate = text;
        Matcher fenced = FENCED.matcher(text);
        if (fenced.find() && fenced.group(1).contains("{")) {
            candidate = fenced.group(1).trim();
        } else {
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                candidate = text.substring(start, end + 1);
            }
        }
        try {
            JsonNode root = mapper.readTree(candidate);
            if (root != null && root.isObject()) {
                return root;
            }
        } catch (Exception ex) {
            throw new IllegalArgumentException("Reply is not valid JSON", ex);
        }
        throw new IllegalArgumentException("Reply is not a JSON object");
    }

    public static Iterable<JsonNode> array(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isArray() ? value : List.of();
    }

    public static boolean hasArray(JsonNode node, String field) {
        return node.path(field).isArray();
    }

    public static String text(JsonNode node, String field, int max) {
        return clip(node.path(field).asText(null), max);
    }

    public static List<String> strings(JsonNode node, String field, int maxItems, int maxLength) {
        List<String> out = new ArrayList<>();
        for (JsonNode item : array(node, field)) {
            String value = clip(item.asText(null), maxLength);
            if (value != null && out.size() < maxItems) {
                out.add(value);
            }
        }
        return out;
    }

    /** 0-100 from a number or a string such as "72%"; null when absent. */
    public static Integer score(JsonNode node) {
        if (node.isNumber()) {
            return clamp(node.asInt());
        }
        if (node.isTextual()) {
            Matcher m = DIGITS.matcher(node.asText(""));
            if (m.find()) {
                return clamp(Integer.parseInt(m.group()));
            }
        }
        return null;
    }

    public static int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    public static String clip(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max - 1).trim() + "…";
    }
}
