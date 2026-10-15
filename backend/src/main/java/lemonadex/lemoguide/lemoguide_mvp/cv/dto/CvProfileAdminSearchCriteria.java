package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

/** Filters for {@code GET /api/admin/cv-profiles}. Any {@code null} field is ignored. */
public record CvProfileAdminSearchCriteria(String keyword, Long userInformationId, Boolean isActive) {
}
