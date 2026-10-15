package lemonadex.lemoguide.lemoguide_mvp.contact.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;

public record ContactResponse(
        Long id,
        String type,
        String value,
        boolean primary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ContactResponse from(Contact c) {
        return new ContactResponse(c.getId(), c.getType().name(), c.getValue(), c.isPrimary(),
                c.getCreatedAt(), c.getUpdatedAt());
    }
}
