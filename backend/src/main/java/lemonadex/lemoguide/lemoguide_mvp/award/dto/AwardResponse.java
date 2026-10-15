package lemonadex.lemoguide.lemoguide_mvp.award.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.award.entity.Award;

public record AwardResponse(
        Long id,
        String name,
        String grantedBy,
        Integer grantedYear,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static AwardResponse from(Award a) {
        return new AwardResponse(a.getId(), a.getName(), a.getGrantedBy(), a.getGrantedYear(),
                a.getDescription(), a.getCreatedAt(), a.getUpdatedAt());
    }
}
