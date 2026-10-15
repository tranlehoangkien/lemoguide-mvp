package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifySharePasswordRequest(@NotBlank String password) {
}
