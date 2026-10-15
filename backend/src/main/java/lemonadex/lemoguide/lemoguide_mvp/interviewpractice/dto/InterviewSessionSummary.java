package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto;

import java.time.LocalDateTime;
import java.util.Map;

import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.entity.InterviewSession;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service.InterviewScoring;

/** One row of the practice history. */
public record InterviewSessionSummary(
        Long id,
        String positionTitle,
        String level,
        String interviewType,
        String targetLabel,
        int questionCount,
        int answeredCount,
        String status,
        Integer overallScore,
        String verdict,
        Map<String, Integer> criteriaScores,
        LocalDateTime createdAt,
        LocalDateTime completedAt) {

    public static InterviewSessionSummary from(InterviewSession session, int answeredCount,
            Map<String, Integer> criteriaScores) {
        return new InterviewSessionSummary(session.getId(), session.getPositionTitle(), session.getLevel(),
                session.getInterviewType(), session.getTargetLabel(), session.getQuestionCount(), answeredCount,
                session.getStatus(), session.getOverallScore(), InterviewScoring.verdict(session.getOverallScore()),
                criteriaScores, session.getCreatedAt(), session.getCompletedAt());
    }
}
