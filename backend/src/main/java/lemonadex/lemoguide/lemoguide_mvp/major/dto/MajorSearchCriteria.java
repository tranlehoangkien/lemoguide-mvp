package lemonadex.lemoguide.lemoguide_mvp.major.dto;

/**
 * Filters for {@code GET /api/admin/majors}. {@code keyword} matches name or
 * description; {@code name} matches the name only. Any {@code null} field is
 * ignored.
 */
public record MajorSearchCriteria(String keyword, String name) {
}
