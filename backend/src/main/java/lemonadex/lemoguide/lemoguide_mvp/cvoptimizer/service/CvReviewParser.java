package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult.Criterion;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult.Finding;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult.KeywordStatus;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Normalizes the model's CV review into a {@link CvReviewResult}: five fixed criteria in a fixed
 * order, findings pointing only at refs that really exist in the CV, capped lists. Tolerant of
 * fences, prose and sloppy spellings, strict about the one thing that matters: the reply must
 * contain a review at all, otherwise it throws so the runner can retry.
 *
 * <p>The model grades the five criteria; the overall score and the verdict are computed here from
 * them ({@link #WEIGHTS}), like the interview session score, so they always agree with the criteria
 * shown next to them and one wobbly overall number from the model cannot move the headline.
 */
final class CvReviewParser {

    static final int MAX_FINDINGS = 8;
    static final int MAX_KEYWORDS = 15;
    static final int MAX_FACTS = 5;

    /** Criterion key to its Vietnamese label, in display order. */
    static final Map<String, String> CRITERIA = new LinkedHashMap<>();

    static {
        CRITERIA.put("structure", "Bố cục và đầy đủ");
        CRITERIA.put("keywords", "Từ khóa và ATS");
        CRITERIA.put("impact", "Số liệu và tác động");
        CRITERIA.put("clarity", "Diễn đạt rõ ràng");
        CRITERIA.put("relevance", "Mức liên quan");
    }

    /** Share of each criterion in the overall score; only the criteria the model returned count. */
    static final Map<String, Integer> WEIGHTS = Map.of(
            "structure", 15,
            "keywords", 25,
            "impact", 25,
            "clarity", 15,
            "relevance", 20);

    private static final Set<String> SEVERITIES = Set.of("high", "medium", "low");

    private CvReviewParser() {
    }

    /**
     * @param itemLabels label of every valid ref of the CV; a finding whose ref is not here is kept
     *                   as a general finding (ref null) instead of pointing at nothing
     * @throws IllegalArgumentException when the reply holds no usable review
     */
    static CvReviewResult parse(ObjectMapper mapper, String raw, Map<String, String> itemLabels) {
        JsonNode root = AiReplies.jsonObject(mapper, raw);

        Map<String, Criterion> byKey = new LinkedHashMap<>();
        for (JsonNode node : AiReplies.array(root, "criteria")) {
            String key = AiReplies.text(node, "key", 30);
            if (key == null) {
                continue;
            }
            key = key.toLowerCase(Locale.ROOT);
            Integer score = AiReplies.score(node.path("score"));
            if (CRITERIA.containsKey(key) && score != null && !byKey.containsKey(key)) {
                byKey.put(key, new Criterion(key, CRITERIA.get(key), score, AiReplies.text(node, "finding", 400),
                        AiReplies.text(node, "fix", 400)));
            }
        }
        List<Criterion> criteria = new ArrayList<>();
        CRITERIA.keySet().forEach(key -> {
            if (byKey.containsKey(key)) {
                criteria.add(byKey.get(key));
            }
        });

        List<Finding> findings = new ArrayList<>();
        for (JsonNode node : AiReplies.array(root, "sectionFindings")) {
            String issue = AiReplies.text(node, "issue", 500);
            if (issue == null || findings.size() >= MAX_FINDINGS) {
                continue;
            }
            String ref = AiReplies.text(node, "ref", 80);
            boolean known = ref != null && itemLabels.containsKey(ref);
            String severity = AiReplies.text(node, "severity", 12);
            severity = severity != null && SEVERITIES.contains(severity.toLowerCase(Locale.ROOT))
                    ? severity.toLowerCase(Locale.ROOT) : "medium";
            findings.add(new Finding(known ? ref : null, known ? itemLabels.get(ref) : "Toàn bộ CV", severity, issue,
                    AiReplies.text(node, "suggestion", 500)));
        }
        findings.sort((a, b) -> Integer.compare(rank(a.severity()), rank(b.severity())));

        List<KeywordStatus> keywords = new ArrayList<>();
        for (JsonNode node : AiReplies.array(root, "keywordCoverage")) {
            String keyword = AiReplies.text(node, "keyword", 80);
            if (keyword != null && keywords.size() < MAX_KEYWORDS) {
                String status = AiReplies.text(node, "status", 12);
                boolean present = status != null && status.equalsIgnoreCase("present");
                keywords.add(new KeywordStatus(keyword, present ? "present" : "missing", AiReplies.text(node, "where", 200)));
            }
        }

        String summary = AiReplies.text(root, "summary", 700);
        if (summary == null && criteria.isEmpty() && findings.isEmpty()) {
            throw new IllegalArgumentException("Reply has no review content");
        }

        // Without a single usable criterion the model's own overall number is all there is.
        Integer overall = criteria.isEmpty() ? AiReplies.score(root.path("overallScore")) : weightedScore(criteria);
        return new CvReviewResult(overall, verdict(overall), summary, criteria, findings, keywords,
                AiReplies.strings(root, "missingFacts", MAX_FACTS, 300));
    }

    /** Weighted mean of the criteria present, rounded; the weights are re-normalized over what is there. */
    static int weightedScore(List<Criterion> criteria) {
        int weighted = 0;
        int total = 0;
        for (Criterion criterion : criteria) {
            int weight = WEIGHTS.getOrDefault(criterion.key(), 0);
            weighted += weight * criterion.score();
            total += weight;
        }
        return (int) Math.round((double) weighted / total);
    }

    private static int rank(String severity) {
        return switch (severity) {
            case "high" -> 0;
            case "medium" -> 1;
            default -> 2;
        };
    }

    static String verdict(Integer score) {
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
}
