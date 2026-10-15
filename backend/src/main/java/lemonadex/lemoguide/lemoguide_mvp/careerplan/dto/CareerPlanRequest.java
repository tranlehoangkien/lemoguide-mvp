package lemonadex.lemoguide.lemoguide_mvp.careerplan.dto;

import jakarta.validation.constraints.*;

public record CareerPlanRequest(
        @NotBlank @Pattern(regexp = "target|explore|transition") String intent,
        @Size(max = 200) String targetRole,
        @NotNull @Min(1) @Max(20) Integer hoursPerWeek,
        @Min(4) Integer durationWeeks,
        @NotNull Boolean useProfile,
        @Positive Long cvProfileId,
        @Size(max = 4000) String background,
        @Size(max = 1500) String constraints,
        @Positive Long modelId,
        @Positive Long replacePlanId,
        @Size(max = 36) String proposalId) {
}
