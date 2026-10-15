package lemonadex.lemoguide.lemoguide_mvp.experience.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link TargetTag} to the lowercase tokens of the {@code experience.target_tag} ENUM. */
@Converter(autoApply = false)
public class TargetTagConverter implements AttributeConverter<TargetTag, String> {

    @Override
    public String convertToDatabaseColumn(TargetTag attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public TargetTag convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TargetTag.valueOf(dbData.trim().toUpperCase());
    }
}
