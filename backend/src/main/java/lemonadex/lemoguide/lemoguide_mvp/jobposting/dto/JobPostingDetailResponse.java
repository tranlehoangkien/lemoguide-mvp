package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Full detail view of a job posting, including the caller's per-skill match breakdown. */
public record JobPostingDetailResponse(
        Long id,
        String companyName,
        String companyLogoUrl,
        String title,
        String description,
        String requirements,
        String benefits,
        String location,
        String employmentType,
        String experienceLevel,
        Integer salaryMin,
        Integer salaryMax,
        String salaryCurrency,
        boolean isSalaryNegotiable,
        LocalDateTime postedAt,
        LocalDateTime expiresAt,
        Integer matchScore,
        List<RequiredSkillView> skills,
        List<RequiredTechnologyView> technologies
) {
}
