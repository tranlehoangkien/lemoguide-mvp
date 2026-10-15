package lemonadex.lemoguide.lemoguide_mvp.experience.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.experience.entity.TargetTag;

/** Create / replace payload for one experience record. */
public record ExperienceRequest(
        @NotBlank @Size(max = 200) String companyName,
        @NotBlank @Size(max = 150) String jobTitle,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        boolean current,
        String description,
        TargetTag targetTag,
        int displayOrder,
        List<Long> technologyIds
) {
}
