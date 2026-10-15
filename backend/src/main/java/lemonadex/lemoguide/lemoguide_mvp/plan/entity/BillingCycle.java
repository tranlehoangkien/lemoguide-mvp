package lemonadex.lemoguide.lemoguide_mvp.plan.entity;

/**
 * How a {@link Plan} is billed. Persisted lowercase to match the
 * {@code plan.billing_cycle} MySQL ENUM ('monthly','yearly','one_time') via
 * {@link BillingCycleConverter}.
 */
public enum BillingCycle {
    MONTHLY,
    YEARLY,
    ONE_TIME
}
