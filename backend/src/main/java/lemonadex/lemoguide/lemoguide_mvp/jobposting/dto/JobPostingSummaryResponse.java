package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Card view for the "Viec lam phu hop" feed. */
public record JobPostingSummaryResponse(
        Long id,
        String companyName,
        String companyLogoUrl,
        String title,
        String location,
        String employmentType,
        String experienceLevel,
        Integer salaryMin,
        Integer salaryMax,
        String salaryCurrency,
        boolean isSalaryNegotiable,
        LocalDateTime postedAt,
        /** null when the job posting has no required skill/technology to match against. */
        Integer matchScore,
        List<String> topMatchedSkillNames
) {
}
