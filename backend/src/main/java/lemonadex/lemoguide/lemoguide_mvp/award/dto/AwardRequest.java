package lemonadex.lemoguide.lemoguide_mvp.award.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create / replace payload for one award record. */
public record AwardRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 200) String grantedBy,
        Integer grantedYear,
        String description
) {
}
