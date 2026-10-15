package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param answer the answer as text, typed or transcribed from speech
 * @param durationSeconds how long the user took, measured by the client
 * @param source typed | voice (default typed)
 */
public record InterviewAnswerRequest(
        @NotBlank @Size(max = 4000) String answer,
        @Min(0) @Max(3600) Integer durationSeconds,
        @Size(max = 10) String source) {
}
