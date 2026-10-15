package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.util.List;

/**
 * The structured review the model returns (see the {@code cv_review} prompt in
 * {@code V30__add_cv_optimizer.sql}), normalized by {@code CvReviewParser}. Also the JSON
 * stored in {@code cv_ai_review.result_json}.
 */
public record CvReviewResult(
        Integer overallScore,
        String verdict,
        String summary,
        List<Criterion> criteria,
        List<Finding> sectionFindings,
        List<KeywordStatus> keywordCoverage,
        List<String> missingFacts
) {

    public record Criterion(String key, String label, Integer score, String finding, String fix) {
    }

    /** {@code severity}: high | medium | low. {@code ref} is null for a finding about the CV as a whole. */
    public record Finding(String ref, String itemLabel, String severity, String issue, String suggestion) {
    }

    /** {@code status}: present | missing. */
    public record KeywordStatus(String keyword, String status, String where) {
    }
}
