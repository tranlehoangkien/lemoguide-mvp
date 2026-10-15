package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.spec;

import org.springframework.data.jpa.domain.Specification;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;

/** {@link Specification} builders for {@link AiPromptTemplate} search (Criteria API). */
public final class AiPromptTemplateSpecifications {

    private AiPromptTemplateSpecifications() {
    }

    public static Specification<AiPromptTemplate> actionType(ActionType actionType) {
        if (actionType == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("actionType"), actionType);
    }

    public static Specification<AiPromptTemplate> modelId(Long modelId) {
        if (modelId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("modelId"), modelId);
    }

    public static Specification<AiPromptTemplate> isActive(Boolean isActive) {
        if (isActive == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("isActive"), isActive);
    }
}
