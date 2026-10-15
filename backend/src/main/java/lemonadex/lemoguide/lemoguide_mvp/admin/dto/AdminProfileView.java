package lemonadex.lemoguide.lemoguide_mvp.admin.dto;

import java.time.LocalDate;

import lemonadex.lemoguide.lemoguide_mvp.admin.entity.AdminInformation;

/** Full {@code admin_information} profile. */
public record AdminProfileView(
        Long id,
        String fullName,
        String avatarUrl,
        String currentTitle,
        LocalDate dateOfBirth,
        String gender,
        String city,
        String district
) {

    public static AdminProfileView from(AdminInformation p) {
        return new AdminProfileView(p.getId(), p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict());
    }
}
