package lemonadex.lemoguide.lemoguide_mvp.referrer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Visibility;

/** Create / replace payload for one referrer record. */
public record ReferrerRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 150) String position,
        @Size(max = 200) String company,
        @Size(max = 255) String contactInfo,
        @NotNull Visibility visibility
) {
}
