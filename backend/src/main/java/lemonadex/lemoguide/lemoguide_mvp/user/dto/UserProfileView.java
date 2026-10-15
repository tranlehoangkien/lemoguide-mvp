package lemonadex.lemoguide.lemoguide_mvp.user.dto;

import java.time.LocalDate;

import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;

/** Full {@code user_information} profile. */
public record UserProfileView(
        Long id,
        String fullName,
        String avatarUrl,
        String currentTitle,
        LocalDate dateOfBirth,
        String gender,
        String shortTermGoal,
        String longTermGoal,
        String city,
        String district
) {

    public static UserProfileView from(UserInformation p) {
        return new UserProfileView(
                p.getId(), p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(), p.getDateOfBirth(),
                p.getGender(), p.getShortTermGoal(), p.getLongTermGoal(), p.getCity(), p.getDistrict());
    }
}
