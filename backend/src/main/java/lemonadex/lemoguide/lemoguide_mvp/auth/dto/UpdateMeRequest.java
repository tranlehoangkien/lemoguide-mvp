package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;

/** Partial update of the caller's own profile. {@code null} fields are left unchanged. */
public record UpdateMeRequest(
        @Size(max = 150) String fullName,
        @Size(max = 500) String avatarUrl,
        @Size(max = 150) String currentTitle,
        LocalDate dateOfBirth,
        @Size(max = 10) String gender,
        @Size(max = 100) String city,
        @Size(max = 100) String district,
        String shortTermGoal,
        String longTermGoal
) {
}
