package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/** Ownership check shared by every optimizer task: a CV is only reachable by the caller who owns it. */
@Component
@RequiredArgsConstructor
class CvAccess {

    private final CvProfileRepository cvProfileRepository;
    private final CurrentUserProfileService currentUserProfile;

    CvProfile requireOwned(Long cvProfileId) {
        Long ownerId = currentUserProfile.requireId();
        return cvProfileRepository.findByIdAndUserInformationId(cvProfileId, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found"));
    }
}
