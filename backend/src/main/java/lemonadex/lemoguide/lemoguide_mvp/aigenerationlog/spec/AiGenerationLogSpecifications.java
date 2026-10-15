package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.spec;

import org.springframework.data.jpa.domain.Specification;

import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.AiGenerationLog;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;

/** {@link Specification} builders for admin {@link AiGenerationLog} search (Criteria API). */
public final class AiGenerationLogSpecifications {

    private AiGenerationLogSpecifications() {
    }

    public static Specification<AiGenerationLog> accountId(Long accountId) {
        if (accountId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("accountId"), accountId);
    }

    public static Specification<AiGenerationLog> actionType(ActionType actionType) {
        if (actionType == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("actionType"), actionType);
    }

    public static Specification<AiGenerationLog> status(GenerationStatus status) {
        if (status == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}
