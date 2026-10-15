package lemonadex.lemoguide.lemoguide_mvp.course.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link CourseLevel} to the lowercase snake_case tokens of the ENUM column. */
@Converter(autoApply = false)
public class CourseLevelConverter implements AttributeConverter<CourseLevel, String> {

    @Override
    public String convertToDatabaseColumn(CourseLevel attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public CourseLevel convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CourseLevel.valueOf(dbData.trim().toUpperCase());
    }
}
