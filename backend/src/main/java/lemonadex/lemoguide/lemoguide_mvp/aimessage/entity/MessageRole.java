package lemonadex.lemoguide.lemoguide_mvp.aimessage.entity;

/**
 * Who sent one {@code ai_message} turn. Persisted lowercase to match the
 * {@code ai_message.role} MySQL ENUM ('user','assistant','system') via
 * {@link MessageRoleConverter}.
 */
public enum MessageRole {
    USER,
    ASSISTANT,
    SYSTEM
}
