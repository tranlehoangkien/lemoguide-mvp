package lemonadex.lemoguide.lemoguide_mvp.plan.dto;

/** Filters for {@code GET /api/admin/plans}. {@code keyword} matches the plan name. */
public record PlanSearchCriteria(String keyword) {
}
