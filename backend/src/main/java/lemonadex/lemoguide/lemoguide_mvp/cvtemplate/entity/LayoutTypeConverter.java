package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link LayoutType} to the lowercase tokens of the {@code cv_template.layout_type} ENUM. */
@Converter(autoApply = false)
public class LayoutTypeConverter implements AttributeConverter<LayoutType, String> {

    @Override
    public String convertToDatabaseColumn(LayoutType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public LayoutType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : LayoutType.valueOf(dbData.trim().toUpperCase());
    }
}
