package lemonadex.lemoguide.lemoguide_mvp.referrer.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link Visibility} to the lowercase tokens of the {@code referrer.visibility} ENUM. */
@Converter(autoApply = false)
public class VisibilityConverter implements AttributeConverter<Visibility, String> {

    @Override
    public String convertToDatabaseColumn(Visibility attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public Visibility convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Visibility.valueOf(dbData.trim().toUpperCase());
    }
}
