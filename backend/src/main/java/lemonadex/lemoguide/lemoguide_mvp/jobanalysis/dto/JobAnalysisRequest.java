package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto;

/**
 * Optional body of {@code POST .../ai-analysis}. {@code modelId} picks a specific
 * active model (default: the first active one with an analysis prompt);
 * {@code refresh} forces a new model call even when the stored result is still
 * up to date.
 */
public record JobAnalysisRequest(Long modelId, Boolean refresh) {

    public boolean forceRefresh() {
        return Boolean.TRUE.equals(refresh);
    }
}
