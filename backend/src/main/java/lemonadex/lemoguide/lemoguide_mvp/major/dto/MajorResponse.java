package lemonadex.lemoguide.lemoguide_mvp.major.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;

public record MajorResponse(
        Long id,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static MajorResponse from(Major m) {
        return new MajorResponse(m.getId(), m.getName(), m.getDescription(), m.getCreatedAt(), m.getUpdatedAt());
    }
}
