package lemonadex.lemoguide.lemoguide_mvp.auth.entity;

/**
 * The fixed set of roles an {@link Account} can hold. Stored in the {@code role}
 * table by name (see {@code V2__add_role_and_admin_information.sql}) and mapped
 * as a string on {@link Role#getName()}.
 */
public enum RoleName {
    ADMIN,
    USER
}
