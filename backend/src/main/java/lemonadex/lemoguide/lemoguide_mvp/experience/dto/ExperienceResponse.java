package lemonadex.lemoguide.lemoguide_mvp.experience.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.TargetTag;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;

public record ExperienceResponse(
        Long id,
        String companyName,
        String jobTitle,
        LocalDate startDate,
        LocalDate endDate,
        boolean current,
        String description,
        TargetTag targetTag,
        int displayOrder,
        List<TechnologyResponse> technologies,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ExperienceResponse from(Experience e, List<TechnologyResponse> technologies) {
        return new ExperienceResponse(e.getId(), e.getCompanyName(), e.getJobTitle(), e.getStartDate(),
                e.getEndDate(), e.isCurrent(), e.getDescription(), e.getTargetTag(), e.getDisplayOrder(),
                technologies, e.getCreatedAt(), e.getUpdatedAt());
    }
}
