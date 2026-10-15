package lemonadex.lemoguide.lemoguide_mvp.skill.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;

public final class SkillSpecifications {

    private SkillSpecifications() {
    }

    /** Case-insensitive match of {@code keyword} against name OR description. */
    public static Specification<Skill> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("description")), like));
    }

    public static Specification<Skill> nameContains(String name) {
        if (!StringUtils.hasText(name)) {
            return Specification.unrestricted();
        }
        String like = "%" + name.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), like);
    }

    public static Specification<Skill> typeEquals(SkillType type) {
        if (type == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }
}
