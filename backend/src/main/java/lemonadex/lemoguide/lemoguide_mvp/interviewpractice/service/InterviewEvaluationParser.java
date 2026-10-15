package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.AiReplies;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewEvaluation;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewEvaluation.Criterion;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Normalizes the model's feedback on one answer: four fixed criteria in a fixed order, the answer's
 * score computed from them (the model's own overall number is only a fallback), capped lists. Throws
 * when the reply holds no usable feedback so the runner can retry.
 */
final class InterviewEvaluationParser {

    private static final int MAX_POINTS = 3;

    private InterviewEvaluationParser() {
    }

    /** @throws IllegalArgumentException when the reply has neither scores nor any written feedback */
    static InterviewEvaluation parse(ObjectMapper mapper, String raw) {
        JsonNode root = AiReplies.jsonObject(mapper, raw);

        Map<String, Criterion> byKey = new LinkedHashMap<>();
        for (JsonNode node : AiReplies.array(root, "criteria")) {
            String key = AiReplies.text(node, "key", 30);
            Integer score = AiReplies.score(node.path("score"));
            if (key == null || score == null) {
                continue;
            }
            key = key.toLowerCase(Locale.ROOT);
            if (InterviewScoring.CRITERIA.containsKey(key) && !byKey.containsKey(key)) {
                byKey.put(key, new Criterion(key, InterviewScoring.CRITERIA.get(key), score, AiReplies.text(node, "comment", 400)));
            }
        }
        List<Criterion> criteria = new ArrayList<>();
        InterviewScoring.CRITERIA.keySet().forEach(key -> {
            if (byKey.containsKey(key)) {
                criteria.add(byKey.get(key));
            }
        });

        List<String> strengths = AiReplies.strings(root, "strengths", MAX_POINTS, 400);
        List<String> improvements = AiReplies.strings(root, "improvements", MAX_POINTS, 400);
        String sample = AiReplies.text(root, "sampleAnswer", 1500);
        String followUp = AiReplies.text(root, "followUp", 300);
        if (followUp != null && followUp.equalsIgnoreCase("null")) {
            followUp = null;
        }

        Integer given = AiReplies.score(root.path("score"));
        if (criteria.isEmpty() && given == null) {
            throw new IllegalArgumentException("Reply has no scores");
        }
        if (strengths.isEmpty() && improvements.isEmpty() && sample == null) {
            throw new IllegalArgumentException("Reply has no written feedback");
        }

        Integer score = criteria.size() == InterviewScoring.CRITERIA.size() || given == null
                ? InterviewScoring.average(criteria.stream().map(Criterion::score).toList())
                : given;
        return new InterviewEvaluation(score, criteria, strengths, improvements, sample, followUp, List.of(), null);
    }
}
