package lemonadex.lemoguide.lemoguide_mvp.jobdescription.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.jobdescription.entity.JobDescription;

public record JobDescriptionResponse(
        Long id,
        Long accountId,
        Long cvProfileId,
        String rawText,
        String extractedKeywords,
        Integer matchScore,
        LocalDateTime createdAt
) {

    public static JobDescriptionResponse from(JobDescription jd) {
        return new JobDescriptionResponse(jd.getId(), jd.getAccountId(), jd.getCvProfileId(), jd.getRawText(),
                jd.getExtractedKeywords(), jd.getMatchScore(), jd.getCreatedAt());
    }
}
