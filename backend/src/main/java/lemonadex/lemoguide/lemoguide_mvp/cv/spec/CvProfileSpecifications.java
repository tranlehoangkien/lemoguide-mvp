package lemonadex.lemoguide.lemoguide_mvp.cv.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;

/** {@link Specification} builders for admin {@link CvProfile} search (Criteria API). */
public final class CvProfileSpecifications {

    private CvProfileSpecifications() {
    }

    public static Specification<CvProfile> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), like);
    }

    public static Specification<CvProfile> userInformationId(Long userInformationId) {
        if (userInformationId == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("userInformationId"), userInformationId);
    }

    public static Specification<CvProfile> isActive(Boolean isActive) {
        if (isActive == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("isActive"), isActive);
    }
}
