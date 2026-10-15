package lemonadex.lemoguide.lemoguide_mvp.cv.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvSectionVisibilityRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvSectionVisibilityResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvSectionVisibility;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvSectionVisibilityRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service management of one CV's section show/hide + ordering ("Cau hinh
 * hien thi"), scoped to a {@code cv_profile} owned by the caller.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvSectionVisibilityService {

    private final CvSectionVisibilityRepository sectionVisibilityRepository;
    private final CvProfileRepository cvProfileRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public List<CvSectionVisibilityResponse> list(Long cvProfileId) {
        requireOwnedProfile(cvProfileId);
        return sectionVisibilityRepository.findByCvProfileIdOrderByDisplayOrderAsc(cvProfileId).stream()
                .map(CvSectionVisibilityResponse::from)
                .toList();
    }

    /** Creates the row on first use, or updates it if the section already has one (upsert). */
    public CvSectionVisibilityResponse upsert(Long cvProfileId, String sectionName, CvSectionVisibilityRequest request) {
        requireOwnedProfile(cvProfileId);
        CvSectionVisibility section = sectionVisibilityRepository
                .findByCvProfileIdAndSectionName(cvProfileId, sectionName)
                .orElseGet(() -> CvSectionVisibility.builder()
                        .cvProfileId(cvProfileId)
                        .sectionName(sectionName)
                        .build());
        section.setIsVisible(request.isVisible());
        section.setDisplayOrder(request.displayOrder());
        return CvSectionVisibilityResponse.from(sectionVisibilityRepository.save(section));
    }

    public void delete(Long cvProfileId, Long sectionId) {
        requireOwnedProfile(cvProfileId);
        CvSectionVisibility section = sectionVisibilityRepository.findByIdAndCvProfileId(sectionId, cvProfileId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Section not found"));
        sectionVisibilityRepository.delete(section);
    }

    private void requireOwnedProfile(Long cvProfileId) {
        Long ownerId = currentUserProfile.requireId();
        cvProfileRepository.findByIdAndUserInformationId(cvProfileId, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found"));
    }
}
