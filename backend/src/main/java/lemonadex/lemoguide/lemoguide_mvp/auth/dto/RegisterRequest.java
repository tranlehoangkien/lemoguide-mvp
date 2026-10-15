package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Sign-up payload shared by {@code POST /api/auth/register} (USER) and
 * {@code POST /api/auth/register-admin} (ADMIN). {@code fullName} seeds the
 * matching {@code user_information} / {@code admin_information} row.
 */
public record RegisterRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 150) String fullName
) {
}
