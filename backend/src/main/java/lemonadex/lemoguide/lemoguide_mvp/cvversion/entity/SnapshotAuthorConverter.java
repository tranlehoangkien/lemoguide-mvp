package lemonadex.lemoguide.lemoguide_mvp.cvversion.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link SnapshotAuthor} to the lowercase tokens of the {@code cv_version.created_by} ENUM. */
@Converter(autoApply = false)
public class SnapshotAuthorConverter implements AttributeConverter<SnapshotAuthor, String> {

    @Override
    public String convertToDatabaseColumn(SnapshotAuthor attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public SnapshotAuthor convertToEntityAttribute(String dbData) {
        return dbData == null ? null : SnapshotAuthor.valueOf(dbData.trim().toUpperCase());
    }
}
