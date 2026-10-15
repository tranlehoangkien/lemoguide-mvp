package lemonadex.lemoguide.lemoguide_mvp.project.spec;

import java.time.LocalDate;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;

/**
 * {@link Specification} builders for {@link Project} search (Criteria API). An
 * absent (null / blank) argument yields {@link Specification#unrestricted()}
 * (always true) so callers can chain every filter with {@code .and(...)}.
 */
public final class ProjectSpecifications {

    private ProjectSpecifications() {
    }

    public static Specification<Project> ownedBy(Long userInformationId) {
        if (userInformationId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("userInformationId"), userInformationId);
    }

    public static Specification<Project> nameContains(String term) {
        if (!StringUtils.hasText(term)) {
            return Specification.unrestricted();
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), like);
    }

    public static Specification<Project> startedOnOrAfter(LocalDate date) {
        if (date == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startDate"), date);
    }

    public static Specification<Project> endedOnOrBefore(LocalDate date) {
        if (date == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("endDate"), date);
    }
}
