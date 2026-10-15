package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link ExperienceLevel} to the lowercase snake_case tokens of the ENUM column. */
@Converter(autoApply = false)
public class ExperienceLevelConverter implements AttributeConverter<ExperienceLevel, String> {

    @Override
    public String convertToDatabaseColumn(ExperienceLevel attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ExperienceLevel convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ExperienceLevel.valueOf(dbData.trim().toUpperCase());
    }
}
