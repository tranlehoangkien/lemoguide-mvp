package lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto;

import jakarta.validation.constraints.NotBlank;

/** Create / replace payload for a {@code job_description}. */
public record JobDescriptionRequest(
        Long cvProfileId,
        @NotBlank String rawText
) {
}
