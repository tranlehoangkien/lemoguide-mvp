package lemonadex.lemoguide.lemoguide_mvp.cvexport.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link ExportFormat} to the lowercase tokens of the {@code cv_export.format} ENUM. */
@Converter(autoApply = false)
public class ExportFormatConverter implements AttributeConverter<ExportFormat, String> {

    @Override
    public String convertToDatabaseColumn(ExportFormat attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ExportFormat convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ExportFormat.valueOf(dbData.trim().toUpperCase());
    }
}
