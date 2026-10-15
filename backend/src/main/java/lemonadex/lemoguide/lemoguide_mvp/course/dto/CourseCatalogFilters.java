package lemonadex.lemoguide.lemoguide_mvp.course.dto;

import java.util.List;

/** Only values attached to published courses are exposed to the user catalog. */
public record CourseCatalogFilters(List<String> providers, List<CourseTagView> skills,
        List<CourseTagView> technologies) {
}
