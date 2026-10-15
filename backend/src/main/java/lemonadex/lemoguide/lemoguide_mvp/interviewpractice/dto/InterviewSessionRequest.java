package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.OptimizeTarget;

/**
 * Setup of a practice session. Every field is optional: the CV and target ground the questions in the
 * user's real profile, the position defaults to the target job's title or the CV's current title.
 *
 * @param level fresher | junior | middle | senior (default junior)
 * @param interviewType behavioral | technical | mixed (default mixed)
 * @param questionCount 3-12 (default 8)
 */
public record InterviewSessionRequest(
        Long cvProfileId,
        OptimizeTarget target,
        @Size(max = 200) String positionTitle,
        @Size(max = 20) String level,
        @Size(max = 20) String interviewType,
        @Min(3) @Max(12) Integer questionCount,
        Long modelId) {
}
