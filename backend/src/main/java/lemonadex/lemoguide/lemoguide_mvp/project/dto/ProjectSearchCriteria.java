package lemonadex.lemoguide.lemoguide_mvp.project.dto;

import java.time.LocalDate;

/** Filters for {@code GET /api/me/projects}. Any {@code null} field is ignored. */
public record ProjectSearchCriteria(String name, LocalDate startedOnOrAfter, LocalDate endedOnOrBefore) {
}
