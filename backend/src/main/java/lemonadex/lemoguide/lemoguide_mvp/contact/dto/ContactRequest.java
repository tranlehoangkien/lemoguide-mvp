package lemonadex.lemoguide.lemoguide_mvp.contact.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.contact.entity.ContactType;

/** Create / replace payload for one contact channel. */
public record ContactRequest(
        @NotNull ContactType type,
        @NotBlank @Size(max = 255) String value,
        boolean primary
) {
}
