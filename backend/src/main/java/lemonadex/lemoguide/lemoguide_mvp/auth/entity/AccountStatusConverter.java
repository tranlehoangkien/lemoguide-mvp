package lemonadex.lemoguide.lemoguide_mvp.auth.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Maps {@link AccountStatus} to the lowercase tokens stored by the
 * {@code account.status} MySQL ENUM ('active','inactive','banned').
 */
@Converter(autoApply = false)
public class AccountStatusConverter implements AttributeConverter<AccountStatus, String> {

    @Override
    public String convertToDatabaseColumn(AccountStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public AccountStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : AccountStatus.valueOf(dbData.trim().toUpperCase());
    }
}
