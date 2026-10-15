package lemonadex.lemoguide.lemoguide_mvp.contact.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.ContactType;

/**
 * {@link Specification} builders for {@link Contact} search (Criteria API). An
 * absent argument yields {@link Specification#unrestricted()} (always true) so
 * callers can chain every filter with {@code .and(...)} unconditionally.
 */
public final class ContactSpecifications {

    private ContactSpecifications() {
    }

    public static Specification<Contact> ownedBy(Long userInformationId) {
        if (userInformationId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("userInformationId"), userInformationId);
    }

    public static Specification<Contact> hasType(ContactType type) {
        if (type == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    public static Specification<Contact> isPrimary(Boolean primary) {
        if (primary == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("primary"), primary);
    }

    public static Specification<Contact> valueContains(String term) {
        if (!StringUtils.hasText(term)) {
            return Specification.unrestricted();
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("value")), like);
    }
}
