package lemonadex.lemoguide.lemoguide_mvp.project.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create / replace payload for one project record. */
public record ProjectRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 150) String role,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        @Size(max = 500) String demoUrl,
        @Size(max = 500) String githubUrl,
        int displayOrder,
        List<Long> technologyIds
) {
}
