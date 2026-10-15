package lemonadex.lemoguide.lemoguide_mvp.education.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Create / replace payload for one education record. */
public record EducationRequest(
        Long majorId,
        @NotBlank @Size(max = 200) String schoolName,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @DecimalMin("0.00") @DecimalMax("10.00") @Digits(integer = 2, fraction = 2) BigDecimal gpa,
        @Size(max = 50) String classification,
        String thesisAchievement
) {
}
