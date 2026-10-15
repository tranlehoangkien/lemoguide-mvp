package lemonadex.lemoguide.lemoguide_mvp.experience.spec;

import java.time.LocalDate;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.TargetTag;

/**
 * {@link Specification} builders for {@link Experience} search (Criteria API). An
 * absent (null / blank) argument yields {@link Specification#unrestricted()}
 * (always true) so callers can chain every filter with {@code .and(...)}.
 */
public final class ExperienceSpecifications {

    private ExperienceSpecifications() {
    }

    public static Specification<Experience> ownedBy(Long userInformationId) {
        if (userInformationId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("userInformationId"), userInformationId);
    }

    public static Specification<Experience> companyContains(String term) {
        if (!StringUtils.hasText(term)) {
            return Specification.unrestricted();
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("companyName")), like);
    }

    public static Specification<Experience> hasTargetTag(TargetTag targetTag) {
        if (targetTag == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("targetTag"), targetTag);
    }

    public static Specification<Experience> isCurrent(Boolean current) {
        if (current == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("current"), current);
    }

    public static Specification<Experience> startedOnOrAfter(LocalDate date) {
        if (date == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startDate"), date);
    }

    public static Specification<Experience> endedOnOrBefore(LocalDate date) {
        if (date == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("endDate"), date);
    }
}
