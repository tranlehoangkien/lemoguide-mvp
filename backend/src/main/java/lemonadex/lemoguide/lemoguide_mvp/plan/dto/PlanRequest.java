package lemonadex.lemoguide.lemoguide_mvp.plan.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.plan.entity.BillingCycle;

/** Create / replace payload for a {@code plan}. */
public record PlanRequest(
        @NotBlank @Size(max = 50) String name,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotNull BillingCycle billingCycle,
        @NotNull @Min(0) Integer aiCreditsPerMonth,
        @Min(0) Integer maxCvs,
        @Min(0) Integer messagesPerDay,
        @Min(0) Integer messagesPerWeek,
        @Min(0) Integer messagesPerMonth,
        boolean allowPremiumTemplates,
        boolean isActive
) {
}
