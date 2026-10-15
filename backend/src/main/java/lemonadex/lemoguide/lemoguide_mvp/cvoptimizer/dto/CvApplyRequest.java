package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

/** @param generationLogId the suggest call these changes came from, recorded on the undo snapshot */
public record CvApplyRequest(
        @NotEmpty @Size(max = 30) List<@Valid AppliedChange> changes,
        Long generationLogId
) {
}
