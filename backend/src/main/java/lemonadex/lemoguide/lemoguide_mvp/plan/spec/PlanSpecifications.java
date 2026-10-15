package lemonadex.lemoguide.lemoguide_mvp.plan.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.plan.entity.Plan;

/** {@link Specification} builders for {@link Plan} search (Criteria API). */
public final class PlanSpecifications {

    private PlanSpecifications() {
    }

    public static Specification<Plan> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), like);
    }
}
