package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.time.LocalDateTime;

/**
 * @param cached true when served from the stored review instead of a fresh model call
 * @param stale true when the CV or the target changed since the review ran
 */
public record CvReviewResponse(
        Long cvProfileId,
        String targetKey,
        String targetLabel,
        boolean cached,
        boolean stale,
        LocalDateTime analyzedAt,
        String modelName,
        CvReviewResult review
) {
}
