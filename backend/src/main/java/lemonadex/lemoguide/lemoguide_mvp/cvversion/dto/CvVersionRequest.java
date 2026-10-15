package lemonadex.lemoguide.lemoguide_mvp.cvversion.dto;

import jakarta.validation.constraints.NotBlank;

/** Payload to snapshot the current CV state. {@code snapshot} is raw JSON text. */
public record CvVersionRequest(@NotBlank String snapshot) {
}
