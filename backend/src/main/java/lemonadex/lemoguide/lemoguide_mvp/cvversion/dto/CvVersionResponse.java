package lemonadex.lemoguide.lemoguide_mvp.cvversion.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.CvVersion;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.SnapshotAuthor;

public record CvVersionResponse(
        Long id,
        Long cvProfileId,
        String snapshot,
        SnapshotAuthor createdBy,
        Long aiGenerationLogId,
        LocalDateTime createdAt
) {

    public static CvVersionResponse from(CvVersion v) {
        return new CvVersionResponse(v.getId(), v.getCvProfileId(), v.getSnapshot(), v.getCreatedBy(),
                v.getAiGenerationLogId(), v.getCreatedAt());
    }
}
