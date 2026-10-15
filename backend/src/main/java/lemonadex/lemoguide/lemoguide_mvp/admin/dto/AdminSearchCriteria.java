package lemonadex.lemoguide.lemoguide_mvp.admin.dto;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;

/**
 * Filters for {@code GET /api/admin/admins}. Any {@code null} field is
 * ignored; {@code includeDeleted} defaults to hiding soft-deleted accounts.
 */
public record AdminSearchCriteria(AccountStatus status, String search, boolean includeDeleted) {
}
