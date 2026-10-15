package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link GenerationStatus} to the lowercase tokens of the {@code ai_generation_log.status} ENUM. */
@Converter(autoApply = false)
public class GenerationStatusConverter implements AttributeConverter<GenerationStatus, String> {

    @Override
    public String convertToDatabaseColumn(GenerationStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public GenerationStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : GenerationStatus.valueOf(dbData.trim().toUpperCase());
    }
}
