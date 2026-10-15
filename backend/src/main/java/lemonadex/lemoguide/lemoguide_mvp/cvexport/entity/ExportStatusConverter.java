package lemonadex.lemoguide.lemoguide_mvp.cvexport.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link ExportStatus} to the lowercase tokens of the {@code cv_export.status} ENUM. */
@Converter(autoApply = false)
public class ExportStatusConverter implements AttributeConverter<ExportStatus, String> {

    @Override
    public String convertToDatabaseColumn(ExportStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ExportStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ExportStatus.valueOf(dbData.trim().toUpperCase());
    }
}
