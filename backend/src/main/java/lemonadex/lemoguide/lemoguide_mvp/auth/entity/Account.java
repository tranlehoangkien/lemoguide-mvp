package lemonadex.lemoguide.lemoguide_mvp.auth.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Login identity shared by admins and end users. The {@link #role} decides which
 * profile table ({@code user_information} or {@code admin_information}) carries
 * the rest of the person's data.
 */
@Entity
@Table(name = "account")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    /** "Unlimited" sentinel for {@link #aiCreditsRemaining} — see its Javadoc. */
    public static final int UNLIMITED_AI_CREDITS = 999_999_999;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Convert(converter = AccountStatusConverter.class)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    /**
     * Plain id into {@code plan} (see {@code lemoguide_mvp.plan.entity.Plan}), kept
     * as a raw column rather than a {@code @ManyToOne} so the auth package stays
     * independent of the plan package, matching the {@code education.major_id}
     * convention elsewhere in this codebase.
     */
    @Column(name = "plan_id", nullable = false)
    @Builder.Default
    private Long planId = 1L;

    /**
     * Vestigial: {@code MyAiConversationService.sendMessage} no longer checks or
     * decrements this (AI Coach sending is unmetered — see its Javadoc), so this
     * stays frozen at the "unlimited" sentinel below for every account. Kept
     * (rather than dropped) so the {@code ai_credit_transaction} ledger and its
     * admin CRUD still have a balance to reconcile against if metering is ever
     * reintroduced.
     */
    @Column(name = "ai_credits_remaining", nullable = false)
    @Builder.Default
    private Integer aiCreditsRemaining = UNLIMITED_AI_CREDITS;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
