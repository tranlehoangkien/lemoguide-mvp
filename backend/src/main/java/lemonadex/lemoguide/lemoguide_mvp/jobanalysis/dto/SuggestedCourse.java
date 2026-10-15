package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto;

import java.util.List;

/**
 * A course from the admin-curated catalog that teaches one or more of the
 * skills/technologies the job requires and the caller is missing. Computed from
 * the catalog (never by the model), so titles and links are always real.
 */
public record SuggestedCourse(
        Long id,
        String title,
        String provider,
        String url,
        String level,
        Integer durationHours,
        boolean isFree,
        List<String> covers
) {
}
