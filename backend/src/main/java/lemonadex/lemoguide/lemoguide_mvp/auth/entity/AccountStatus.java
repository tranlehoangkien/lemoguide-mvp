package lemonadex.lemoguide.lemoguide_mvp.auth.entity;

/**
 * Lifecycle state of an {@link Account}. Only {@link #ACTIVE} accounts may log
 * in. Persisted lowercase to match the {@code account.status} MySQL ENUM
 * ('active','inactive','banned') via {@link AccountStatusConverter}.
 */
public enum AccountStatus {
    ACTIVE,
    INACTIVE,
    BANNED
}
