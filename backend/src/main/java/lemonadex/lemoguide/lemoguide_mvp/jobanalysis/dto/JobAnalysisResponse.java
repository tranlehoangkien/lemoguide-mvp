package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @param cached true when this came from the stored result instead of a fresh model call
 * @param stale true when the caller's profile or the job posting changed since the analysis
 *              ran, so re-running may give a different answer
 * @param baseMatchScore the cheap tag-overlap percentage shown on the job card (null: no data)
 */
public record JobAnalysisResponse(
        Long jobId,
        boolean cached,
        boolean stale,
        LocalDateTime analyzedAt,
        String modelName,
        Integer baseMatchScore,
        JobAnalysisResult analysis,
        List<SuggestedCourse> suggestedCourses
) {
}
