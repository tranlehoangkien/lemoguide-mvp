package lemonadex.lemoguide.lemoguide_mvp.interest.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.interest.entity.Interest;

public record InterestResponse(
        Long id,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static InterestResponse from(Interest i) {
        return new InterestResponse(i.getId(), i.getName(), i.getDescription(), i.getCreatedAt(), i.getUpdatedAt());
    }
}
