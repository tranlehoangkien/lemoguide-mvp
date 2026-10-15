package lemonadex.lemoguide.lemoguide_mvp.profileimport.dto;

import jakarta.validation.constraints.NotBlank;

/** Raw CV text (already extracted from PDF, or pasted by hand) to extract a Profile patch from. */
public record ProfileExtractRequest(@NotBlank String sourceText) {
}
