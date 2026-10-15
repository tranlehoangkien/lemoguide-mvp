package lemonadex.lemoguide.lemoguide_mvp.major.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create / replace payload for a {@code major}. */
public record MajorRequest(
        @NotBlank @Size(max = 150) String name,
        String description
) {
}
