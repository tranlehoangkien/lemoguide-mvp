package lemonadex.lemoguide.lemoguide_mvp.technology.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;

public record TechnologyResponse(
        Long id,
        String name,
        String category,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static TechnologyResponse from(Technology t) {
        return new TechnologyResponse(
                t.getId(),
                t.getName(),
                t.getCategory(),
                t.getDescription(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
