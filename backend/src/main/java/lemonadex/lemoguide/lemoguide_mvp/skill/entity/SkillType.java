package lemonadex.lemoguide.lemoguide_mvp.skill.entity;

public enum SkillType {
    hard,
    soft,
    language;

    public static SkillType fromString(String value) {
        if (value == null) return null;
        for (SkillType st : values()) {
            if (st.name().equalsIgnoreCase(value.trim())) {
                return st;
            }
        }
        return null;
    }
}
