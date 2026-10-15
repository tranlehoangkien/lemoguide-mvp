package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.util.List;

/**
 * One proposed rewrite of one field. {@code before} is filled in by the server from the CV (never
 * copied by the model), so applying can check the field did not change meanwhile.
 *
 * @param unverifiedNumbers figures in {@code after} that appear nowhere in the CV: the model may
 *                          have invented them, the UI warns the user
 */
public record CvSuggestion(
        String id,
        String ref,
        String section,
        String itemLabel,
        String field,
        String fieldLabel,
        String before,
        String after,
        String reason,
        List<String> unverifiedNumbers
) {
}
