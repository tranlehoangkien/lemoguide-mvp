package lemonadex.lemoguide.lemoguide_mvp.user.dto;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;

/**
 * Filters for {@code GET /api/admin/users}. Any {@code null} field is
 * ignored; {@code includeDeleted} defaults to hiding soft-deleted accounts.
 */
public record UserSearchCriteria(AccountStatus status, String search, boolean includeDeleted) {
}
