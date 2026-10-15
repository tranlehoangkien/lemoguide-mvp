package lemonadex.lemoguide.lemoguide_mvp.admin.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;

/**
 * {@link Specification} builders for {@link Account} search on the admin
 * "manage admins" screen (Criteria API). An absent (null / blank) argument
 * yields {@link Specification#unrestricted()} (always true) so callers can
 * chain every filter with {@code .and(...)} unconditionally.
 */
public final class AdminSpecifications {

    private AdminSpecifications() {
    }

    /** Restricts the search to accounts holding the {@link RoleName#ADMIN} role. */
    public static Specification<Account> isAdmin() {
        return (root, query, cb) -> cb.equal(root.get("role").get("name"), RoleName.ADMIN);
    }

    public static Specification<Account> hasStatus(AccountStatus status) {
        if (status == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /** Soft-deleted accounts are hidden unless {@code includeDeleted} is true. */
    public static Specification<Account> includeDeleted(boolean includeDeleted) {
        if (includeDeleted) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<Account> emailContains(String term) {
        if (!StringUtils.hasText(term)) {
            return Specification.unrestricted();
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("email")), like);
    }
}
