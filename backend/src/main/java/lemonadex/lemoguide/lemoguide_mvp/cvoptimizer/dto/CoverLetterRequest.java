package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import jakarta.validation.constraints.Size;

/**
 * @param tone professional | friendly | confident (default professional)
 * @param language vi | en (default vi)
 * @param notes optional extra guidance, e.g. "nhấn mạnh kinh nghiệm làm việc từ xa"
 */
public record CoverLetterRequest(
        Long modelId,
        OptimizeTarget target,
        String tone,
        String language,
        @Size(max = 500) String notes
) {
}
