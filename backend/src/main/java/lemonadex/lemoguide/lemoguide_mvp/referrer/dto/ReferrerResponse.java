package lemonadex.lemoguide.lemoguide_mvp.referrer.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Referrer;
import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Visibility;

public record ReferrerResponse(
        Long id,
        String name,
        String position,
        String company,
        String contactInfo,
        Visibility visibility,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ReferrerResponse from(Referrer r) {
        return new ReferrerResponse(r.getId(), r.getName(), r.getPosition(), r.getCompany(),
                r.getContactInfo(), r.getVisibility(), r.getCreatedAt(), r.getUpdatedAt());
    }
}
