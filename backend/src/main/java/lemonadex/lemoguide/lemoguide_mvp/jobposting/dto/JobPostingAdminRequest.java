package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.EmploymentType;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.ExperienceLevel;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingSource;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingStatus;

/** Create / update payload for a {@code job_posting}, admin-only. */
public record JobPostingAdminRequest(
        @NotNull JobPostingSource source,
        @Size(max = 500) String sourceUrl,
        @NotBlank @Size(max = 200) String companyName,
        @Size(max = 500) String companyLogoUrl,
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        String requirements,
        String benefits,
        @Size(max = 150) String location,
        @NotNull EmploymentType employmentType,
        @NotNull ExperienceLevel experienceLevel,
        Integer salaryMin,
        Integer salaryMax,
        boolean isSalaryNegotiable,
        @NotNull JobPostingStatus status,
        List<TagAssignment> skills,
        List<TagAssignment> technologies
) {
}
