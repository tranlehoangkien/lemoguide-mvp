package lemonadex.lemoguide.lemoguide_mvp.referrer.entity;

/**
 * Who can see a {@code referrer} row. Persisted lowercase to match the
 * {@code referrer.visibility} MySQL ENUM ('private','public') via
 * {@link VisibilityConverter}.
 */
public enum Visibility {
    PRIVATE,
    PUBLIC
}
