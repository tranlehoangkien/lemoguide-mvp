package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto;

import java.util.List;

/**
 * Feedback on one answer. {@code score} is the mean of the criteria (computed in code), possibly capped
 * for a too-short answer, in which case {@code note} says so. {@code unverifiedNumbers} lists figures in
 * the sample answer that neither the CV nor the user's answer contains.
 */
public record InterviewEvaluation(
        int score,
        List<Criterion> criteria,
        List<String> strengths,
        List<String> improvements,
        String sampleAnswer,
        String followUp,
        List<String> unverifiedNumbers,
        String note) {

    public record Criterion(String key, String label, int score, String comment) {
    }
}
