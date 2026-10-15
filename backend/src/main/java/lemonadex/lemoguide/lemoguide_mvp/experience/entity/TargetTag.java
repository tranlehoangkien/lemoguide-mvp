package lemonadex.lemoguide.lemoguide_mvp.experience.entity;

/**
 * Career track an {@code experience} row is tagged for. Persisted lowercase to
 * match the {@code experience.target_tag} MySQL ENUM
 * ('frontend','backend','fullstack','other') via {@link TargetTagConverter}.
 */
public enum TargetTag {
    FRONTEND,
    BACKEND,
    FULLSTACK,
    OTHER
}
