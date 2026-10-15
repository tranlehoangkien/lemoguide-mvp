package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CoverLetterUpdateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 20000) String content
) {
}
