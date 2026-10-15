package lemonadex.lemoguide.lemoguide_mvp.cvexport.dto;

import jakarta.validation.constraints.NotNull;

import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.ExportStatus;

/** Payload to mark an export finished (or failed), called by the export worker once it completes. */
public record CvExportStatusUpdateRequest(@NotNull ExportStatus status, String fileUrl) {
}
