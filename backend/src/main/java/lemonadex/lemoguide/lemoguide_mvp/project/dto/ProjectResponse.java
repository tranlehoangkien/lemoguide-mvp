package lemonadex.lemoguide.lemoguide_mvp.project.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;

public record ProjectResponse(
        Long id,
        String name,
        String role,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String demoUrl,
        String githubUrl,
        int displayOrder,
        List<TechnologyResponse> technologies,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ProjectResponse from(Project p, List<TechnologyResponse> technologies) {
        return new ProjectResponse(p.getId(), p.getName(), p.getRole(), p.getDescription(), p.getStartDate(),
                p.getEndDate(), p.getDemoUrl(), p.getGithubUrl(), p.getDisplayOrder(), technologies,
                p.getCreatedAt(), p.getUpdatedAt());
    }
}
