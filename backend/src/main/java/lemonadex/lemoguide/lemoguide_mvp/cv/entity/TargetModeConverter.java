package lemonadex.lemoguide.lemoguide_mvp.cv.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link TargetMode} to the lowercase tokens of the {@code cv_profile.target_mode} ENUM. */
@Converter(autoApply = false)
public class TargetModeConverter implements AttributeConverter<TargetMode, String> {

    @Override
    public String convertToDatabaseColumn(TargetMode attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public TargetMode convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TargetMode.valueOf(dbData.trim().toUpperCase());
    }
}
