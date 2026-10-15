package lemonadex.lemoguide.lemoguide_mvp.skill.dto;

import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;

public record SkillSearchCriteria(
        String keyword,
        String name,
        SkillType type
) {
}
