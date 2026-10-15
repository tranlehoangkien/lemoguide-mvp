package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link ActionType} to the lowercase snake_case tokens of the {@code action_type} ENUM. */
@Converter(autoApply = false)
public class ActionTypeConverter implements AttributeConverter<ActionType, String> {

    @Override
    public String convertToDatabaseColumn(ActionType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ActionType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ActionType.valueOf(dbData.trim().toUpperCase());
    }
}
