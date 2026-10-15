package lemonadex.lemoguide.lemoguide_mvp.cvversion.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.dto.CvVersionRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.dto.CvVersionResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.CvVersion;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.SnapshotAuthor;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.repository.CvVersionRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service snapshot history of one CV, scoped to a {@code cv_profile} owned
 * by the caller. Snapshots are immutable once created (undo/compare only), so
 * there is deliberately no update operation here.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvVersionService {

    private final CvVersionRepository cvVersionRepository;
    private final CvProfileRepository cvProfileRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<CvVersionResponse> list(Long cvProfileId, Pageable pageable) {
        requireOwnedProfile(cvProfileId);
        return cvVersionRepository.findByCvProfileIdOrderByCreatedAtDesc(cvProfileId, pageable)
                .map(CvVersionResponse::from);
    }

    @Transactional(readOnly = true)
    public CvVersionResponse get(Long cvProfileId, Long id) {
        return CvVersionResponse.from(require(cvProfileId, id));
    }

    public CvVersionResponse create(Long cvProfileId, CvVersionRequest request) {
        requireOwnedProfile(cvProfileId);
        CvVersion version = cvVersionRepository.save(CvVersion.builder()
                .cvProfileId(cvProfileId)
                .snapshot(request.snapshot())
                .createdBy(SnapshotAuthor.USER)
                .build());
        return CvVersionResponse.from(version);
    }

    public void delete(Long cvProfileId, Long id) {
        cvVersionRepository.delete(require(cvProfileId, id));
    }

    private CvVersion require(Long cvProfileId, Long id) {
        requireOwnedProfile(cvProfileId);
        return cvVersionRepository.findByIdAndCvProfileId(id, cvProfileId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV version not found"));
    }

    private void requireOwnedProfile(Long cvProfileId) {
        Long ownerId = currentUserProfile.requireId();
        cvProfileRepository.findByIdAndUserInformationId(cvProfileId, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV not found"));
    }
}
