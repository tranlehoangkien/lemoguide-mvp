package lemonadex.lemoguide.lemoguide_mvp.plan.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A subscription tier (Free / Pro / Enterprise). Mapped to the {@code plan}
 * table from {@code V6__add_cv_ai_management.sql}. Referenced by
 * {@code account.plan_id} as a plain id (see {@code Account.getPlanId()}) to
 * keep the auth package independent of this one.
 */
@Entity
@Table(name = "plan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Convert(converter = BillingCycleConverter.class)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    @Builder.Default
    private BillingCycle billingCycle = BillingCycle.MONTHLY;

    @Column(name = "ai_credits_per_month", nullable = false)
    @Builder.Default
    private Integer aiCreditsPerMonth = 0;

    /** {@code NULL} means unlimited CVs. */
    @Column(name = "max_cvs")
    private Integer maxCvs;

    /** NULL means unlimited; zero disables sending. */
    @Column(name = "messages_per_day")
    private Integer messagesPerDay;

    @Column(name = "messages_per_week")
    private Integer messagesPerWeek;

    @Column(name = "messages_per_month")
    private Integer messagesPerMonth;

    @Column(name = "allow_premium_templates", nullable = false)
    @Builder.Default
    private Boolean allowPremiumTemplates = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
