package lemonadex.lemoguide.lemoguide_mvp.education.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;

public record EducationResponse(
        Long id,
        Long majorId,
        String majorName,
        String schoolName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal gpa,
        String classification,
        String thesisAchievement,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static EducationResponse from(Education e, String majorName) {
        return new EducationResponse(e.getId(), e.getMajorId(), majorName, e.getSchoolName(),
                e.getStartDate(), e.getEndDate(), e.getGpa(), e.getClassification(), e.getThesisAchievement(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
