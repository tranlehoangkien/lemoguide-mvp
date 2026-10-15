package lemonadex.lemoguide.lemoguide_mvp.cvexport.dto;

import jakarta.validation.constraints.NotNull;

import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.ExportFormat;

/** Payload to start a new export for a CV. */
public record CvExportRequest(@NotNull Long cvProfileId, @NotNull ExportFormat format) {
}
