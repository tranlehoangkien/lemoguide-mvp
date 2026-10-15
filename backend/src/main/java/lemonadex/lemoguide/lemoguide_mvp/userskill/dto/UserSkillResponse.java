package lemonadex.lemoguide.lemoguide_mvp.userskill.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkillSource;

public record UserSkillResponse(
        Long id,
        Long skillId,
        String skillName,
        SkillType skillType,
        Integer proficiencyLevel,
        String languageLevel,
        UserSkillSource source,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static UserSkillResponse from(UserSkill us, Skill skill) {
        return new UserSkillResponse(us.getId(), us.getSkillId(),
                skill != null ? skill.getName() : null,
                skill != null ? skill.getType() : null,
                us.getProficiencyLevel(), us.getLanguageLevel(), us.getSource(), us.getCreatedAt(), us.getUpdatedAt());
    }
}
