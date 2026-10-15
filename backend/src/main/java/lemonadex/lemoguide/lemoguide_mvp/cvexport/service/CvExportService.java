package lemonadex.lemoguide.lemoguide_mvp.cvexport.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportStatusUpdateRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.CvExport;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.ExportStatus;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.repository.CvExportRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service export (PDF/DOCX/PNG) history for the caller's own CVs, scoped
 * to the caller's {@code account} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvExportService {

    private final CvExportRepository cvExportRepository;
    private final CvProfileRepository cvProfileRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<CvExportResponse> list(Pageable pageable) {
        Long accountId = SecurityUtils.currentAccountId();
        return cvExportRepository.findByAccountId(accountId, pageable).map(CvExportResponse::from);
    }

    @Transactional(readOnly = true)
    public CvExportResponse get(Long id) {
        return CvExportResponse.from(require(id));
    }

    /** Starts a new export job; the (future) export worker calls {@link #updateStatus} once it finishes. */
    public CvExportResponse create(CvExportRequest request) {
        Long accountId = SecurityUtils.currentAccountId();
        Long ownerId = currentUserProfile.requireId();
        if (cvProfileRepository.findByIdAndUserInformationId(request.cvProfileId(), ownerId).isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Selected CV does not exist");
        }
        CvExport export = cvExportRepository.save(CvExport.builder()
                .cvProfileId(request.cvProfileId())
                .accountId(accountId)
                .format(request.format())
                .status(ExportStatus.PROCESSING)
                .build());
        return CvExportResponse.from(export);
    }

    public CvExportResponse updateStatus(Long id, CvExportStatusUpdateRequest request) {
        CvExport export = require(id);
        export.setStatus(request.status());
        export.setFileUrl(request.fileUrl());
        return CvExportResponse.from(export);
    }

    public void delete(Long id) {
        cvExportRepository.delete(require(id));
    }

    private CvExport require(Long id) {
        Long accountId = SecurityUtils.currentAccountId();
        return cvExportRepository.findByIdAndAccountId(id, accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Export not found"));
    }
}
