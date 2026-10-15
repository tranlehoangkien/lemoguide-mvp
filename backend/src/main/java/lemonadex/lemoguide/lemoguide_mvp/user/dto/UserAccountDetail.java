package lemonadex.lemoguide.lemoguide_mvp.user.dto;

import java.time.LocalDateTime;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardResponse;
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateResponse;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactResponse;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationResponse;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceResponse;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestResponse;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectResponse;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerResponse;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillResponse;

/**
 * Full view of one USER account for the admin detail page: credentials
 * metadata plus every {@code user_information}-owned CV section (profile,
 * contacts, education, experience, projects, certificates, awards, interests,
 * referrers and skills).
 */
public record UserAccountDetail(
        Long id,
        String email,
        String role,
        String status,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt,
        Long planId,
        String planName,
        UserProfileView profile,
        List<ContactResponse> contacts,
        List<EducationResponse> education,
        List<ExperienceResponse> experiences,
        List<ProjectResponse> projects,
        List<CertificateResponse> certificates,
        List<AwardResponse> awards,
        List<InterestResponse> interests,
        List<ReferrerResponse> referrers,
        List<UserSkillResponse> skills
) {
}
