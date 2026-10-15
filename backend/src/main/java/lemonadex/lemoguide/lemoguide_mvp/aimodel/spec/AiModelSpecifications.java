package lemonadex.lemoguide.lemoguide_mvp.aimodel.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** {@link Specification} builders for {@link AiModel} search (Criteria API). */
public final class AiModelSpecifications {

    private AiModelSpecifications() {
    }

    public static Specification<AiModel> provider(AiProvider provider) {
        if (provider == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("provider"), provider);
    }

    public static Specification<AiModel> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("modelName")), like);
    }

    public static Specification<AiModel> isActive(Boolean isActive) {
        if (isActive == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("isActive"), isActive);
    }
}
