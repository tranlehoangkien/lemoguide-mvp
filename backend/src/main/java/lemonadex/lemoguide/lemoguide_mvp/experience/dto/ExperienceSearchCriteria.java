package lemonadex.lemoguide.lemoguide_mvp.experience.dto;

import java.time.LocalDate;

import lemonadex.lemoguide.lemoguide_mvp.experience.entity.TargetTag;

/** Filters for {@code GET /api/me/experiences}. Any {@code null} field is ignored. */
public record ExperienceSearchCriteria(
        String company,
        TargetTag targetTag,
        Boolean current,
        LocalDate startedOnOrAfter,
        LocalDate endedOnOrBefore
) {
}
