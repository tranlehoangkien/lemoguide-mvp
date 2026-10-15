package lemonadex.lemoguide.lemoguide_mvp.cvexport.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.CvExport;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.ExportFormat;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.ExportStatus;

public record CvExportResponse(
        Long id,
        Long cvProfileId,
        Long accountId,
        ExportFormat format,
        String fileUrl,
        ExportStatus status,
        LocalDateTime createdAt
) {

    public static CvExportResponse from(CvExport e) {
        return new CvExportResponse(e.getId(), e.getCvProfileId(), e.getAccountId(), e.getFormat(),
                e.getFileUrl(), e.getStatus(), e.getCreatedAt());
    }
}
