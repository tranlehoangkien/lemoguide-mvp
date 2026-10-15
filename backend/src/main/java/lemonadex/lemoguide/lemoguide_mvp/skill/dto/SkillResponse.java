package lemonadex.lemoguide.lemoguide_mvp.skill.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;

public record SkillResponse(
        Long id,
        String name,
        SkillType type,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static SkillResponse from(Skill s) {
        return new SkillResponse(
                s.getId(),
                s.getName(),
                s.getType(),
                s.getDescription(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
