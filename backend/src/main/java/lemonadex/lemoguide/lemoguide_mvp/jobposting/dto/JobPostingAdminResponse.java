package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Full detail view of a job posting for the admin management page (no per-user matching). */
public record JobPostingAdminResponse(
        Long id,
        String source,
        String sourceUrl,
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
        String status,
        LocalDateTime postedAt,
        LocalDateTime expiresAt,
        List<RequiredSkillView> skills,
        List<RequiredTechnologyView> technologies,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
