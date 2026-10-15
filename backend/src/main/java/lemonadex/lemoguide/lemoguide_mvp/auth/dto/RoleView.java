package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Role;

/** A role plus how many accounts currently hold it. */
public record RoleView(Long id, String name, String description, long accountCount) {

    public static RoleView of(Role role, long accountCount) {
        return new RoleView(role.getId(), role.getName().name(), role.getDescription(), accountCount);
    }
}
