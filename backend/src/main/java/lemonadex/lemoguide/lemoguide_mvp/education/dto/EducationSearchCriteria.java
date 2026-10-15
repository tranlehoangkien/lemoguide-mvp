package lemonadex.lemoguide.lemoguide_mvp.education.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Filters for {@code GET /api/me/education}. Any {@code null} field is ignored. */
public record EducationSearchCriteria(
        String school,
        Long majorId,
        String classification,
        LocalDate startedOnOrAfter,
        LocalDate endedOnOrBefore,
        BigDecimal minGpa
) {
}
