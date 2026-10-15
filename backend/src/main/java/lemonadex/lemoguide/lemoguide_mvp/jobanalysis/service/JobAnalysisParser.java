package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResult;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResult.ActionStep;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResult.Gap;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResult.Strength;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Turns the model's raw reply into a {@link JobAnalysisResult} the UI can render
 * without defensive checks. Deliberately tolerant - models wrap JSON in code
 * fences, add a sentence around it, send the score as "72%" or use their own
 * severity spelling - but strict about the one thing that matters: the reply
 * must contain an analysis at all, otherwise {@link #parse} throws so the caller
 * can retry instead of storing an empty result.
 */
final class JobAnalysisParser {

    static final int MAX_STRENGTHS = 6;
    static final int MAX_GAPS = 8;
    static final int MAX_HOW_TO_CLOSE = 4;
    static final int MAX_TIPS = 4;
    static final int MAX_STEPS = 5;

    private static final int SHORT_TEXT = 200;
    private static final int LONG_TEXT = 700;

    private static final Pattern FENCED_JSON = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private static final Pattern DIGITS = Pattern.compile("\\d{1,3}");

    private static final Set<String> SEVERITIES = Set.of("critical", "important", "nice_to_have");
    private static final Set<String> IMPORTANCES = Set.of("required", "preferred", "bonus");

    private JobAnalysisParser() {
    }

    /** @throws IllegalArgumentException when the reply holds no usable analysis */
    static JobAnalysisResult parse(ObjectMapper objectMapper, String raw) {
        JsonNode root;
        try {
            root = objectMapper.readTree(extractJson(raw));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Reply is not valid JSON", ex);
        }
        if (root == null || !root.isObject()) {
            throw new IllegalArgumentException("Reply is not a JSON object");
        }

        List<Strength> strengths = new ArrayList<>();
        for (JsonNode node : array(root, "strengths")) {
            String item = text(node, "item", SHORT_TEXT);
            if (item != null && strengths.size() < MAX_STRENGTHS) {
                strengths.add(new Strength(item, text(node, "evidence", LONG_TEXT),
                        oneOf(text(node, "importance", 30), IMPORTANCES, "preferred")));
            }
        }

        List<Gap> gaps = new ArrayList<>();
        for (JsonNode node : array(root, "gaps")) {
            String item = text(node, "item", SHORT_TEXT);
            if (item != null) {
                gaps.add(new Gap(item, oneOf(text(node, "severity", 30), SEVERITIES, "important"),
                        text(node, "why", LONG_TEXT), strings(node, "howToClose", MAX_HOW_TO_CLOSE),
                        text(node, "estimatedEffort", 60)));
            }
        }
        // Most severe first, whatever order the model used (sort is stable).
        gaps.sort((a, b) -> Integer.compare(severityRank(a.severity()), severityRank(b.severity())));
        if (gaps.size() > MAX_GAPS) {
            gaps = new ArrayList<>(gaps.subList(0, MAX_GAPS));
        }

        List<ActionStep> steps = new ArrayList<>();
        for (JsonNode node : array(root, "actionPlan")) {
            // Accept a bare string step as well as the {title, detail, timeframe} object.
            String title = node.isTextual() ? clip(node.asText(null), SHORT_TEXT) : text(node, "title", SHORT_TEXT);
            String detail = node.isTextual() ? null : text(node, "detail", LONG_TEXT);
            if ((title != null || detail != null) && steps.size() < MAX_STEPS) {
                steps.add(new ActionStep(title != null ? title : detail, title != null ? detail : null,
                        node.isTextual() ? null : text(node, "timeframe", 60)));
            }
        }

        String summary = text(root, "summary", LONG_TEXT);
        if (summary == null && strengths.isEmpty() && gaps.isEmpty()) {
            throw new IllegalArgumentException("Reply has no analysis content");
        }

        Integer score = score(root.path("overallScore"));
        return new JobAnalysisResult(score, verdict(text(root, "verdict", 40), score), summary, strengths, gaps,
                strings(root, "cvTips", MAX_TIPS), strings(root, "interviewFocus", MAX_TIPS), steps);
    }

    static String extractJson(String raw) {
        String text = raw == null ? "" : raw.trim();
        Matcher fenced = FENCED_JSON.matcher(text);
        if (fenced.find() && fenced.group(1).contains("{")) {
            return fenced.group(1).trim();
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        return start >= 0 && end > start ? text.substring(start, end + 1) : text;
    }

    private static Integer score(JsonNode node) {
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

    private static int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private static String verdict(String given, Integer score) {
        if (given != null) {
            for (String known : List.of("Rất phù hợp", "Phù hợp một phần", "Chưa phù hợp", "Phù hợp")) {
                if (known.equalsIgnoreCase(given.trim())) {
                    return known;
                }
            }
        }
        if (score == null) {
            return null;
        }
        if (score >= 75) {
            return "Rất phù hợp";
        }
        if (score >= 55) {
            return "Phù hợp";
        }
        return score >= 35 ? "Phù hợp một phần" : "Chưa phù hợp";
    }

    private static int severityRank(String severity) {
        return switch (severity) {
            case "critical" -> 0;
            case "important" -> 1;
            default -> 2;
        };
    }

    private static String oneOf(String value, Set<String> allowed, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        return allowed.contains(normalized) ? normalized : fallback;
    }

    private static Iterable<JsonNode> array(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isArray() ? value : List.of();
    }

    private static List<String> strings(JsonNode node, String field, int max) {
        List<String> out = new ArrayList<>();
        for (JsonNode item : array(node, field)) {
            String value = clip(item.asText(null), LONG_TEXT);
            if (value != null && out.size() < max) {
                out.add(value);
            }
        }
        return out;
    }

    private static String text(JsonNode node, String field, int maxLength) {
        return clip(node.path(field).asText(null), maxLength);
    }

    private static String clip(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength - 1).trim() + "…";
    }
}
