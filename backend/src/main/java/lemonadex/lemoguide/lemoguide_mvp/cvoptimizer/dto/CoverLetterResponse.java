package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.time.LocalDateTime;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity.CoverLetter;

/** @param unverifiedNumbers figures in a freshly generated letter that appear nowhere in the CV (empty otherwise) */
public record CoverLetterResponse(
        Long id,
        Long cvProfileId,
        Long jobPostingId,
        String title,
        String content,
        String tone,
        String language,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<String> unverifiedNumbers
) {

    public static CoverLetterResponse from(CoverLetter c, List<String> unverifiedNumbers) {
        return new CoverLetterResponse(c.getId(), c.getCvProfileId(), c.getJobPostingId(), c.getTitle(),
                c.getContent(), c.getTone(), c.getLanguage(), c.getCreatedAt(), c.getUpdatedAt(), unverifiedNumbers);
    }
}
