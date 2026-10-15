package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

/**
 * @param cachedOnly return the stored review (or nothing) without calling the model
 * @param refresh force a new model call even when the stored review is up to date
 */
public record CvReviewRequest(Long modelId, OptimizeTarget target, Boolean refresh, Boolean cachedOnly) {

    public boolean forceRefresh() {
        return Boolean.TRUE.equals(refresh);
    }

    public boolean storedOnly() {
        return Boolean.TRUE.equals(cachedOnly);
    }
}
