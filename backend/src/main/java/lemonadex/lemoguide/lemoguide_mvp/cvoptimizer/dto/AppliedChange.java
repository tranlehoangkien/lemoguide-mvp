package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** One accepted suggestion sent back to be written into the CV. */
public record AppliedChange(
        @NotBlank @Size(max = 80) String ref,
        @NotBlank @Size(max = 40) String field,
        @Size(max = 6000) String before,
        @NotBlank @Size(max = 6000) String after
) {
}
