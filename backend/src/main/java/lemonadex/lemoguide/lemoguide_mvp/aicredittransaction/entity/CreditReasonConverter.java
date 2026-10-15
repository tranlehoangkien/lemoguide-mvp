package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link CreditReason} to the lowercase snake_case tokens of the {@code reason} ENUM. */
@Converter(autoApply = false)
public class CreditReasonConverter implements AttributeConverter<CreditReason, String> {

    @Override
    public String convertToDatabaseColumn(CreditReason attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public CreditReason convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CreditReason.valueOf(dbData.trim().toUpperCase());
    }
}
