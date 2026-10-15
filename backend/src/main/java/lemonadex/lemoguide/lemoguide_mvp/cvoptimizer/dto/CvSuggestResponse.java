package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.util.List;

public record CvSuggestResponse(
        Long cvProfileId,
        String targetLabel,
        List<CvSuggestion> suggestions,
        List<String> questions,
        Long generationLogId,
        String modelName
) {
}
