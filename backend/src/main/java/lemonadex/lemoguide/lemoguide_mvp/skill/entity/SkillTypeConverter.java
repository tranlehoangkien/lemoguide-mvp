package lemonadex.lemoguide.lemoguide_mvp.skill.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link SkillType} to the lowercase tokens of the {@code skill.type} ENUM. */
@Converter(autoApply = false)
public class SkillTypeConverter implements AttributeConverter<SkillType, String> {

    @Override
    public String convertToDatabaseColumn(SkillType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public SkillType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : SkillType.valueOf(dbData.trim().toUpperCase());
    }
}
