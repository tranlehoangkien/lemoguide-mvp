package lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link ConversationCategory} to the lowercase tokens of the {@code ai_conversation.category} ENUM. */
@Converter(autoApply = false)
public class ConversationCategoryConverter implements AttributeConverter<ConversationCategory, String> {

    @Override
    public String convertToDatabaseColumn(ConversationCategory attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ConversationCategory convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ConversationCategory.valueOf(dbData.trim().toUpperCase());
    }
}
