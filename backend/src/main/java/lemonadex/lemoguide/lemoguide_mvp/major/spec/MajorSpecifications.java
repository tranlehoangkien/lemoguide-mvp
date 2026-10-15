package lemonadex.lemoguide.lemoguide_mvp.major.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;

/**
 * {@link Specification} builders for {@link Major} search (Criteria API). An
 * absent argument yields {@link Specification#unrestricted()} (always true) so
 * callers can chain every filter with {@code .and(...)} unconditionally.
 */
public final class MajorSpecifications {

    private MajorSpecifications() {
    }

    /** Case-insensitive match of {@code keyword} against name OR description. */
    public static Specification<Major> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("description")), like));
    }

    public static Specification<Major> nameContains(String name) {
        if (!StringUtils.hasText(name)) {
            return Specification.unrestricted();
        }
        String like = "%" + name.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), like);
    }
}
