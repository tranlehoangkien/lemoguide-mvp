package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.CvTemplate;

/** {@link Specification} builders for {@link CvTemplate} search (Criteria API). */
public final class CvTemplateSpecifications {

    private CvTemplateSpecifications() {
    }

    public static Specification<CvTemplate> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("category")), like));
    }

    public static Specification<CvTemplate> category(String category) {
        if (!StringUtils.hasText(category)) {
            return Specification.unrestricted();
        }
        String like = "%" + category.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("category")), like);
    }

    public static Specification<CvTemplate> isActive(Boolean isActive) {
        if (isActive == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("isActive"), isActive);
    }

    public static Specification<CvTemplate> isPremium(Boolean isPremium) {
        if (isPremium == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("isPremium"), isPremium);
    }
}
