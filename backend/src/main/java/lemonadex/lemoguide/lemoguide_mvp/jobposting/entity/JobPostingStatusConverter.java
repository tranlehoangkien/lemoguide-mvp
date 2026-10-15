package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link JobPostingStatus} to the lowercase snake_case tokens of the ENUM column. */
@Converter(autoApply = false)
public class JobPostingStatusConverter implements AttributeConverter<JobPostingStatus, String> {

    @Override
    public String convertToDatabaseColumn(JobPostingStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public JobPostingStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : JobPostingStatus.valueOf(dbData.trim().toUpperCase());
    }
}
