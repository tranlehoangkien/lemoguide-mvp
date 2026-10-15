package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.CareerAnalysis;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.AiReplies;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Reject incomplete or over-budget roadmaps so the shared runner can request a corrected reply. */
final class CareerPlanParser {
    record Step(int week, String title, String action, String successCriteria, int estimatedHours,
            List<String> checkpoints, List<String> resources) { }
    record Generated(CareerAnalysis analysis, List<Step> tasks) { }

    private CareerPlanParser() { }

    static Generated parse(ObjectMapper mapper, String raw, int weeks, int hours) {
        return parseRange(mapper, raw, 1, weeks, hours);
    }

    static Generated parseRange(ObjectMapper mapper, String raw, int from, int weeks, int hours) {
        JsonNode root = AiReplies.jsonObject(mapper, raw);
        String goal = required(root, "goal", 200);
        String summary = required(root, "summary", 1200);
        String success = required(root, "successCriteria", 800);
        String nextSteps = AiReplies.text(root, "nextSteps", 600);
        List<CareerAnalysis.Gap> gaps = new ArrayList<>();
        for (JsonNode gap : AiReplies.array(root, "gaps")) {
            String status = required(gap, "status", 30);
            if (!Set.of("missing", "unverified").contains(status)) {
                throw new IllegalArgumentException("Gap status must be missing or unverified");
            }
            if (gaps.size() < 6) gaps.add(new CareerAnalysis.Gap(required(gap, "skill", 150), status, required(gap, "reason", 500)));
        }
        List<CareerAnalysis.Direction> directions = new ArrayList<>();
        for (JsonNode direction : AiReplies.array(root, "directions")) {
            if (directions.size() < 3) directions.add(new CareerAnalysis.Direction(required(direction, "role", 200), required(direction, "reason", 500)));
        }
        List<Step> steps = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (JsonNode task : AiReplies.array(root, "tasks")) {
            int week = integer(task, "week", from, weeks);
            int estimated = integer(task, "estimatedHours", 1, hours);
            if (!seen.add(week)) throw new IllegalArgumentException("Duplicate week");
            List<String> checkpoints = AiReplies.strings(task, "checkpoints", 4, 120);
            if (checkpoints.size() < 2) throw new IllegalArgumentException("At least 2 checkpoints are required per task");
            steps.add(new Step(week, required(task, "title", 200), required(task, "action", 800),
                    required(task, "successCriteria", 600), estimated, checkpoints,
                    AiReplies.strings(task, "resources", 2, 150)));
        }
        if (steps.size() != weeks - from + 1) throw new IllegalArgumentException("One task is required for every week");
        steps.sort(Comparator.comparingInt(Step::week));
        return new Generated(new CareerAnalysis(goal, summary, success,
                AiReplies.strings(root, "strengths", 6, 500), gaps, directions, nextSteps == null ? "" : nextSteps, List.of(), null), steps);
    }

    private static String required(JsonNode node, String field, int max) {
        if (!node.path(field).isTextual()) throw new IllegalArgumentException("Missing text: " + field);
        String value = AiReplies.text(node, field, max);
        if (value == null) throw new IllegalArgumentException("Empty text: " + field);
        return value;
    }

    private static int integer(JsonNode node, String field, int min, int max) {
        JsonNode value = node.path(field);
        if (!value.isIntegralNumber() || !value.canConvertToInt() || value.asInt() < min || value.asInt() > max) {
            throw new IllegalArgumentException("Out of range: " + field);
        }
        return value.asInt();
    }
}
