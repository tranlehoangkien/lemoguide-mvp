package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import java.time.LocalDate;

/** Profile fields common to both {@code user_information} and {@code admin_information}. */
public record MeProfileView(
        String fullName,
        String avatarUrl,
        String currentTitle,
        LocalDate dateOfBirth,
        String gender,
        String city,
        String district,
        String shortTermGoal,
        String longTermGoal
) {
}
