package lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto;

/** Filters for {@code GET /api/admin/job-descriptions}. Any {@code null} field is ignored. */
public record JobDescriptionAdminSearchCriteria(Long accountId) {
}
