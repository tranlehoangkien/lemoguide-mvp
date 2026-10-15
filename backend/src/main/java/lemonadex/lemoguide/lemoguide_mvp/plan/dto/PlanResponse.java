package lemonadex.lemoguide.lemoguide_mvp.plan.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.plan.entity.BillingCycle;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.Plan;

public record PlanResponse(
        Long id,
        String name,
        BigDecimal price,
        BillingCycle billingCycle,
        Integer aiCreditsPerMonth,
        Integer maxCvs,
        Integer messagesPerDay,
        Integer messagesPerWeek,
        Integer messagesPerMonth,
        boolean allowPremiumTemplates,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static PlanResponse from(Plan p) {
        return new PlanResponse(p.getId(), p.getName(), p.getPrice(), p.getBillingCycle(),
                p.getAiCreditsPerMonth(), p.getMaxCvs(), p.getMessagesPerDay(), p.getMessagesPerWeek(), p.getMessagesPerMonth(), p.getAllowPremiumTemplates(), p.getIsActive(),
                p.getCreatedAt(), p.getUpdatedAt());
    }
}
