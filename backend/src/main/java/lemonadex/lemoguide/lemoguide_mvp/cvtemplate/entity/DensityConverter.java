package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link Density} to the lowercase tokens of the {@code cv_template.density} ENUM. */
@Converter(autoApply = false)
public class DensityConverter implements AttributeConverter<Density, String> {

    @Override
    public String convertToDatabaseColumn(Density attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public Density convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Density.valueOf(dbData.trim().toUpperCase());
    }
}
