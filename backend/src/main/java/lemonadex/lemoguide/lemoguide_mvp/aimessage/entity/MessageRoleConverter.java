package lemonadex.lemoguide.lemoguide_mvp.aimessage.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link MessageRole} to the lowercase tokens of the {@code ai_message.role} ENUM. */
@Converter(autoApply = false)
public class MessageRoleConverter implements AttributeConverter<MessageRole, String> {

    @Override
    public String convertToDatabaseColumn(MessageRole attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public MessageRole convertToEntityAttribute(String dbData) {
        return dbData == null ? null : MessageRole.valueOf(dbData.trim().toUpperCase());
    }
}
