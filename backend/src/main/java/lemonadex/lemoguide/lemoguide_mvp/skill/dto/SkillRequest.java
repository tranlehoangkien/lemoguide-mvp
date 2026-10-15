package lemonadex.lemoguide.lemoguide_mvp.skill.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;

/** Create / replace payload for a {@code skill}. */
public record SkillRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull SkillType type,
        String description
) {
}
