package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto;

import java.util.List;

/**
 * The structured analysis the model returns (see the {@code analyze_job} prompt
 * seeded in {@code V28__add_job_ai_analysis.sql}), after
 * {@code JobAnalysisParser} has normalized it: score clamped to 0-100, enums
 * folded to known values, lists capped. This is also the JSON persisted in
 * {@code job_ai_analysis.result_json}.
 */
public record JobAnalysisResult(
        Integer overallScore,
        String verdict,
        String summary,
        List<Strength> strengths,
        List<Gap> gaps,
        List<String> cvTips,
        List<String> interviewFocus,
        List<ActionStep> actionPlan
) {

    /** {@code importance}: required | preferred | bonus. */
    public record Strength(String item, String evidence, String importance) {
    }

    /** {@code severity}: critical | important | nice_to_have. */
    public record Gap(String item, String severity, String why, List<String> howToClose, String estimatedEffort) {
    }

    public record ActionStep(String title, String detail, String timeframe) {
    }
}
