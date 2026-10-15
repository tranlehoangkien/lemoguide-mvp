package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.EmploymentType;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.ExperienceLevel;

/** Filters for {@code GET /api/me/job-postings}. */
public record JobPostingSearchCriteria(
        String keyword,
        String location,
        EmploymentType employmentType,
        ExperienceLevel experienceLevel
) {
}
