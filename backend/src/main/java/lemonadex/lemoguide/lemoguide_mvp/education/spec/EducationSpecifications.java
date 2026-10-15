package lemonadex.lemoguide.lemoguide_mvp.education.spec;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;

/**
 * {@link Specification} builders for {@link Education} search (Criteria API). An
 * absent (null / blank) argument yields {@link Specification#unrestricted()}
 * (always true) so callers can chain every filter with {@code .and(...)}.
 */
public final class EducationSpecifications {

    private EducationSpecifications() {
    }

    public static Specification<Education> ownedBy(Long userInformationId) {
        if (userInformationId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("userInformationId"), userInformationId);
    }

    public static Specification<Education> schoolContains(String term) {
        if (!StringUtils.hasText(term)) {
            return Specification.unrestricted();
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("schoolName")), like);
    }

    public static Specification<Education> hasMajor(Long majorId) {
        if (majorId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("majorId"), majorId);
    }

    public static Specification<Education> hasClassification(String classification) {
        if (!StringUtils.hasText(classification)) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(cb.lower(root.get("classification")),
                classification.trim().toLowerCase());
    }

    public static Specification<Education> startedOnOrAfter(LocalDate date) {
        if (date == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startDate"), date);
    }

    public static Specification<Education> endedOnOrBefore(LocalDate date) {
        if (date == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("endDate"), date);
    }

    public static Specification<Education> gpaAtLeast(BigDecimal minGpa) {
        if (minGpa == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("gpa"), minGpa);
    }
}
