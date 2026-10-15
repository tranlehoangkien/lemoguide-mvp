package lemonadex.lemoguide.lemoguide_mvp.cvexport.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.CvExport;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.repository.CvExportRepository;
import lombok.RequiredArgsConstructor;

/** Read-only oversight of every user's {@code cv_export} rows for admins. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CvExportAdminService {

    private final CvExportRepository cvExportRepository;

    public Page<CvExportResponse> search(Long accountId, Pageable pageable) {
        Page<CvExport> page = accountId != null
                ? cvExportRepository.findByAccountId(accountId, pageable)
                : cvExportRepository.findAll(pageable);
        return page.map(CvExportResponse::from);
    }

    public CvExportResponse get(Long id) {
        return cvExportRepository.findById(id)
                .map(CvExportResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Export not found"));
    }
}
