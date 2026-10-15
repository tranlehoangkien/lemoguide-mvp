package lemonadex.lemoguide.lemoguide_mvp.contact.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link ContactType} to the lowercase tokens of the {@code contact.type} ENUM. */
@Converter(autoApply = false)
public class ContactTypeConverter implements AttributeConverter<ContactType, String> {

    @Override
    public String convertToDatabaseColumn(ContactType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ContactType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ContactType.valueOf(dbData.trim().toUpperCase());
    }
}
