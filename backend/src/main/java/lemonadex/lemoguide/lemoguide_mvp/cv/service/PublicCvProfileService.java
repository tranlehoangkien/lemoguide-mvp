package lemonadex.lemoguide.lemoguide_mvp.cv.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.PublicCvProfileResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lombok.RequiredArgsConstructor;

/** Anonymous access to a CV shared via its public link/slug. */
@Service
@Transactional
@RequiredArgsConstructor
public class PublicCvProfileService {

    private final CvProfileRepository cvProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final lemonadex.lemoguide.lemoguide_mvp.adminconsole.SystemSettingService systemSettings;

    /** Returns the CV if it's publicly viewable and not password-protected. */
    public PublicCvProfileResponse view(String slug) {
        CvProfile profile = requireShareable(slug);
        if (profile.getSharePasswordHash() != null) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "This CV is password protected");
        }
        return recordViewAndRespond(profile);
    }

    /** Returns the CV after checking a share password. */
    public PublicCvProfileResponse verifyPassword(String slug, String password) {
        CvProfile profile = requireShareable(slug);
        if (profile.getSharePasswordHash() == null) {
            return recordViewAndRespond(profile);
        }
        if (!passwordEncoder.matches(password, profile.getSharePasswordHash())) {
            throw new AppException(ErrorCode.ACCESS_DENIED, "Incorrect share password");
        }
        return recordViewAndRespond(profile);
    }

    private CvProfile requireShareable(String slug) {
        if (!systemSettings.cvPublish().publicLinkEnabled()) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found");
        }
        CvProfile profile = cvProfileRepository.findByPublicSlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found"));
        if (!Boolean.TRUE.equals(profile.getIsActive()) || profile.getPublishMode() != PublishMode.PUBLIC_LINK) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found");
        }
        if (profile.getShareExpiresAt() != null && profile.getShareExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "This share link has expired");
        }
        return profile;
    }

    private PublicCvProfileResponse recordViewAndRespond(CvProfile profile) {
        profile.setViewCount(profile.getViewCount() + 1);
        return PublicCvProfileResponse.from(profile);
    }
}
