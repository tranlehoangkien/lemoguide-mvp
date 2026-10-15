package lemonadex.lemoguide.lemoguide_mvp.contact.entity;

/**
 * Kind of contact channel. Persisted lowercase to match the {@code contact.type}
 * MySQL ENUM ('phone','email','linkedin','github','website','other') via
 * {@link ContactTypeConverter}.
 */
public enum ContactType {
    PHONE,
    EMAIL,
    LINKEDIN,
    GITHUB,
    WEBSITE,
    OTHER
}
