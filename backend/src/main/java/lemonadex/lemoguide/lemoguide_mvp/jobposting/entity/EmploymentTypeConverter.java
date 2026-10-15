package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link EmploymentType} to the lowercase snake_case tokens of the ENUM column. */
@Converter(autoApply = false)
public class EmploymentTypeConverter implements AttributeConverter<EmploymentType, String> {

    @Override
    public String convertToDatabaseColumn(EmploymentType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public EmploymentType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EmploymentType.valueOf(dbData.trim().toUpperCase());
    }
}
