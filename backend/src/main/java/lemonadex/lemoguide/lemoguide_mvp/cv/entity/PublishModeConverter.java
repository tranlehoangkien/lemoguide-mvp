package lemonadex.lemoguide.lemoguide_mvp.cv.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Maps {@link PublishMode} to the snake_case tokens of the
 * {@code cv_profile.publish_mode} ENUM, e.g. {@code PUBLIC_LINK <-> "public_link"}.
 */
@Converter(autoApply = false)
public class PublishModeConverter implements AttributeConverter<PublishMode, String> {

    @Override
    public String convertToDatabaseColumn(PublishMode attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public PublishMode convertToEntityAttribute(String dbData) {
        return dbData == null ? null : PublishMode.valueOf(dbData.trim().toUpperCase());
    }
}
