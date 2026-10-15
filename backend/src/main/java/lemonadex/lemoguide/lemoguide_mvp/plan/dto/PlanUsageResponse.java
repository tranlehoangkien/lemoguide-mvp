package lemonadex.lemoguide.lemoguide_mvp.plan.dto;

import java.time.OffsetDateTime;

public record PlanUsageResponse(Long planId, String planName, String timezone,
        Meter dailyMessages, Meter weeklyMessages, Meter monthlyMessages, Meter monthlyCredits, Meter cvs) {
    public record Meter(long used, Integer limit, Long remaining, boolean exhausted, OffsetDateTime resetsAt) {
        public static Meter of(long used, Integer limit, OffsetDateTime resetsAt) {
            return new Meter(used, limit, limit == null ? null : Math.max(0L, limit - used),
                    limit != null && used >= limit, resetsAt);
        }
    }
}
