package lemonadex.lemoguide.lemoguide_mvp.interest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create / replace payload for one interest record. */
public record InterestRequest(
        @NotBlank @Size(max = 150) String name,
        String description
) {
}
