package lemonadex.lemoguide.lemoguide_mvp.cv.service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.repository.CvTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code cv_profile} rows, scoped
 * to the caller's {@code user_information} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvProfileService {

    private static final Pattern NON_SLUG_CHARS = Pattern.compile("[^a-z0-9]+");

    private final CvProfileRepository cvProfileRepository;
    private final CvTemplateRepository cvTemplateRepository;
    private final CurrentUserProfileService currentUserProfile;
    private final PasswordEncoder passwordEncoder;
    private final lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService planUsageService;
    private final lemonadex.lemoguide.lemoguide_mvp.common.storage.AvatarStorageService avatarStorageService;
    private final lemonadex.lemoguide.lemoguide_mvp.adminconsole.SystemSettingService systemSettings;

    @Transactional(readOnly = true)
    public Page<CvProfileResponse> list(Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        return cvProfileRepository.findByUserInformationId(ownerId, pageable).map(CvProfileResponse::from);
    }

    @Transactional(readOnly = true)
    public CvProfileResponse get(Long id) {
        return CvProfileResponse.from(require(id));
    }

    public CvProfileResponse create(CvProfileRequest request) {
        planUsageService.checkCvCreation(lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils.currentAccountId());
        Long ownerId = currentUserProfile.requireId();
        validateTemplate(request);
        // Admin "Cấu hình publish_mode": public links may be switched off, and new public CVs get the default expiry.
        if (request.publishMode() == PublishMode.PUBLIC_LINK) systemSettings.requirePublicLinkAllowed();
        LocalDateTime expiry = request.shareExpiresAt() != null || request.publishMode() != PublishMode.PUBLIC_LINK
                ? request.shareExpiresAt() : systemSettings.defaultShareExpiry();

        CvProfile profile = CvProfile.builder()
                .userInformationId(ownerId)
                .name(request.name().trim())
                .targetMode(request.targetMode())
                .publishMode(request.publishMode())
                .templateId(request.templateId())
                .cvData(request.cvData())
                .activeSections(request.activeSections())
                .avatarUrl(request.avatarUrl())
                .publicSlug(generateUniqueSlug(request.name()))
                .shareExpiresAt(expiry)
                .isActive(request.isActive())
                .build();
        applySharePassword(profile, request.sharePassword());

        return CvProfileResponse.from(cvProfileRepository.save(profile));
    }

    public CvProfileResponse update(Long id, CvProfileRequest request) {
        CvProfile profile = require(id);
        validateTemplate(request);
        boolean becomingPublic = request.publishMode() == PublishMode.PUBLIC_LINK && profile.getPublishMode() != PublishMode.PUBLIC_LINK;
        if (becomingPublic) systemSettings.requirePublicLinkAllowed();

        profile.setName(request.name().trim());
        profile.setTargetMode(request.targetMode());
        profile.setPublishMode(request.publishMode());
        profile.setTemplateId(request.templateId());
        if (request.cvData() != null) {
            profile.setCvData(request.cvData());
        }
        if (request.activeSections() != null) {
            profile.setActiveSections(request.activeSections());
        }
        if (request.avatarUrl() != null) {
            profile.setAvatarUrl(request.avatarUrl().isBlank() ? null : request.avatarUrl());
        }
        // The user app never sends an expiry, so null keeps the current one instead of wiping it on every save.
        if (request.shareExpiresAt() != null) profile.setShareExpiresAt(request.shareExpiresAt());
        else if (becomingPublic && profile.getShareExpiresAt() == null) profile.setShareExpiresAt(systemSettings.defaultShareExpiry());
        profile.setIsActive(request.isActive());
        applySharePassword(profile, request.sharePassword());

        return CvProfileResponse.from(profile);
    }

    public String uploadAvatarOnly(org.springframework.web.multipart.MultipartFile file) {
        return avatarStorageService.store(file);
    }

    public CvProfileResponse uploadAvatar(Long cvId, org.springframework.web.multipart.MultipartFile file) {
        CvProfile profile = require(cvId);
        String avatarUrl = avatarStorageService.store(file);
        profile.setAvatarUrl(avatarUrl);
        return CvProfileResponse.from(profile);
    }

    /** Cascades to {@code cv_section_visibility}/{@code cv_version} etc. via DB {@code ON DELETE CASCADE}. */
    public void delete(Long id) {
        cvProfileRepository.delete(require(id));
    }

    private CvProfile require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return cvProfileRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found"));
    }

    private void validateTemplate(CvProfileRequest request) {
        if (request.templateId() != null && !cvTemplateRepository.existsById(request.templateId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Selected CV template does not exist");
        }
    }

    /** {@code null} keeps the existing password, an empty string clears it. */
    private void applySharePassword(CvProfile profile, String sharePassword) {
        if (sharePassword == null) {
            return;
        }
        profile.setSharePasswordHash(sharePassword.isBlank() ? null : passwordEncoder.encode(sharePassword));
    }

    private String generateUniqueSlug(String name) {
        String base = Normalizer.normalize(name.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        base = NON_SLUG_CHARS.matcher(base).replaceAll("-").replaceAll("^-+|-+$", "");
        if (base.isEmpty()) {
            base = "cv";
        }
        String slug;
        do {
            slug = base + "-" + UUID.randomUUID().toString().substring(0, 8);
        } while (cvProfileRepository.existsByPublicSlug(slug));
        return slug;
    }
}
