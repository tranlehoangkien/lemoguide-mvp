package lemonadex.lemoguide.lemoguide_mvp.technology.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create / replace payload for a {@code technology}. */
public record TechnologyRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 50) String category,
        String description
) {
}
