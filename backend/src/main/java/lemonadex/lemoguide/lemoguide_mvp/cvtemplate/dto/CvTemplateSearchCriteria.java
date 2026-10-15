package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto;

/**
 * Filters for {@code GET /api/admin/cv-templates}. {@code keyword} matches name or
 * category; {@code category} matches the category only. {@code isActive} and
 * {@code isPremium} are exact.
 */
public record CvTemplateSearchCriteria(String keyword, String category, Boolean isPremium, Boolean isActive) {
}
