package lemonadex.lemoguide.lemoguide_mvp.course.dto;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;

/** Filters for {@code GET /api/admin/courses}. */
public record CourseSearchCriteria(
        String keyword,
        CourseLevel level,
        Boolean isActive
) {
}
