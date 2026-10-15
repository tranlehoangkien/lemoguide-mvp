package lemonadex.lemoguide.lemoguide_mvp.user.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;

/** Partial update of a USER's {@code user_information}. {@code null} fields are left unchanged. */
public record UpdateUserProfileRequest(
        @Size(max = 150) String fullName,
        @Size(max = 500) String avatarUrl,
        @Size(max = 150) String currentTitle,
        LocalDate dateOfBirth,
        @Size(max = 10) String gender,
        String shortTermGoal,
        String longTermGoal,
        @Size(max = 100) String city,
        @Size(max = 100) String district
) {
}
