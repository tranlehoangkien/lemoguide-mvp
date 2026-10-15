package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewEvaluation;

/**
 * Every number the user sees for a session comes from here, computed from the per-answer criteria in
 * code. The model grades single answers; it never decides the session score.
 */
public final class InterviewScoring {

    /** Criterion key to its Vietnamese label, in display order. */
    public static final Map<String, String> CRITERIA = new LinkedHashMap<>();

    static {
        CRITERIA.put("relevance", "Đúng trọng tâm");
        CRITERIA.put("structure", "Cấu trúc");
        CRITERIA.put("depth", "Chiều sâu và bằng chứng");
        CRITERIA.put("clarity", "Diễn đạt");
    }

    private InterviewScoring() {
    }

    /** Mean of the scores, rounded; {@code null} when there are none. */
    public static Integer average(Collection<Integer> scores) {
        return scores.isEmpty() ? null : (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    /** Mean score per criterion over the given evaluations; a criterion nobody scored is left out. */
    public static Map<String, Integer> criteriaAverages(List<InterviewEvaluation> evaluations) {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (String key : CRITERIA.keySet()) {
            List<Integer> scores = evaluations.stream()
                    .flatMap(e -> e.criteria().stream())
                    .filter(c -> c.key().equals(key))
                    .map(InterviewEvaluation.Criterion::score)
                    .toList();
            Integer mean = average(scores);
            if (mean != null) {
                out.put(key, mean);
            }
        }
        return out;
    }

    public static String verdict(Integer score) {
        if (score == null) {
            return null;
        }
        if (score >= 80) {
            return "Rất tốt";
        }
        if (score >= 65) {
            return "Khá tốt";
        }
        return score >= 45 ? "Cần cải thiện" : "Yếu";
    }

    public static String categoryLabel(String category) {
        return switch (category == null ? "" : category) {
            case "intro" -> "Mở đầu";
            case "motivation" -> "Động lực";
            case "technical" -> "Chuyên môn";
            case "situational" -> "Tình huống";
            default -> "Hành vi";
        };
    }
}
