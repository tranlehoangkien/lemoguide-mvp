package lemonadex.lemoguide.lemoguide_mvp.userskill.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Create / replace payload for one skill assignment. */
public record UserSkillRequest(
        @NotNull Long skillId,
        @Min(0) @Max(100) Integer proficiencyLevel,
        @Size(max = 50) String languageLevel
) {
}
