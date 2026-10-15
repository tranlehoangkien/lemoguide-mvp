package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** A whole session: setup, every question with its answer and feedback, live stats and, once finished, the report. */
public record InterviewSessionResponse(
        Long id,
        Long cvProfileId,
        Long jobPostingId,
        String positionTitle,
        String level,
        String interviewType,
        String targetKey,
        String targetLabel,
        int questionCount,
        String status,
        Integer overallScore,
        String verdict,
        Map<String, Integer> criteriaScores,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        String modelName,
        List<Question> questions,
        Stats stats,
        InterviewReport report) {

    /**
     * @param wordsPerMinute only for voice answers long enough to measure, else {@code null}
     * @param previousScore score of the attempt this one replaced, {@code null} on a first attempt
     */
    public record Question(
            Long id,
            int seq,
            String category,
            String categoryLabel,
            String question,
            String intent,
            String hint,
            String status,
            String answer,
            String answerSource,
            Integer durationSeconds,
            Integer wordCount,
            Integer fillerCount,
            Integer wordsPerMinute,
            Integer score,
            int attemptCount,
            Integer previousScore,
            InterviewEvaluation evaluation) {
    }

    public record Stats(int answered, int skipped, int total, Integer averageScore, int totalSeconds,
            Integer averageWordsPerMinute, int fillerTotal) {
    }
}
