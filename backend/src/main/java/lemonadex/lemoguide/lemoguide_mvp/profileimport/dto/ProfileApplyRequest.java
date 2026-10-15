package lemonadex.lemoguide.lemoguide_mvp.profileimport.dto;

import jakarta.validation.constraints.NotBlank;

/** The JSON patch returned by {@code /extract}, sent back verbatim (edited or not) to be applied. */
public record ProfileApplyRequest(@NotBlank String patch) {
}
