package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import java.util.ArrayList;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.AiReplies;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewReport;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewReport.Priority;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Normalizes the model's end-of-session write-up. Throws when the reply holds nothing readable. */
final class InterviewReportParser {

    private static final int MAX_POINTS = 4;
    private static final int MAX_PRIORITIES = 3;

    private InterviewReportParser() {
    }

    /** @throws IllegalArgumentException when the reply has no summary and no points at all */
    static InterviewReport parse(ObjectMapper mapper, String raw) {
        JsonNode root = AiReplies.jsonObject(mapper, raw);
        String summary = AiReplies.text(root, "summary", 900);
        List<String> strengths = AiReplies.strings(root, "strengths", MAX_POINTS, 400);
        List<String> weaknesses = AiReplies.strings(root, "weaknesses", MAX_POINTS, 400);

        List<Priority> priorities = new ArrayList<>();
        for (JsonNode node : AiReplies.array(root, "priorities")) {
            String title = AiReplies.text(node, "title", 150);
            String action = AiReplies.text(node, "action", 500);
            if ((title != null || action != null) && priorities.size() < MAX_PRIORITIES) {
                priorities.add(new Priority(title != null ? title : action, action));
            }
        }
        if (summary == null && strengths.isEmpty() && weaknesses.isEmpty() && priorities.isEmpty()) {
            throw new IllegalArgumentException("Reply has no report content");
        }
        return new InterviewReport(summary, strengths, weaknesses, priorities);
    }
}
