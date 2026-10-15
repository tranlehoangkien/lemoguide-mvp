package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link JobPostingSource} to the lowercase snake_case tokens of the ENUM column. */
@Converter(autoApply = false)
public class JobPostingSourceConverter implements AttributeConverter<JobPostingSource, String> {

    @Override
    public String convertToDatabaseColumn(JobPostingSource attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public JobPostingSource convertToEntityAttribute(String dbData) {
        return dbData == null ? null : JobPostingSource.valueOf(dbData.trim().toUpperCase());
    }
}
