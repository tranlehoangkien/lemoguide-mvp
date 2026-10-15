package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;

/**
 * Partial update of an account's access fields. Any {@code null} field is left
 * unchanged. Changing {@code role} only re-points {@code account.role_id}; it
 * does not create or move the profile row in {@code user_information} /
 * {@code admin_information}. Changing {@code planId} re-points {@code
 * account.plan_id} to another {@code plan} row (see {@code
 * lemoguide_mvp.plan.entity.Plan}) - free, immediate, no billing involved.
 */
public record UpdateAccountRequest(RoleName role, AccountStatus status, Long planId) {
}
