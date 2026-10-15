package lemonadex.lemoguide.lemoguide_mvp.aimodel.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link AiProvider} to the lowercase tokens of the {@code ai_model.provider} ENUM. */
@Converter(autoApply = false)
public class AiProviderConverter implements AttributeConverter<AiProvider, String> {

    @Override
    public String convertToDatabaseColumn(AiProvider attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public AiProvider convertToEntityAttribute(String dbData) {
        return dbData == null ? null : AiProvider.valueOf(dbData.trim().toUpperCase());
    }
}
