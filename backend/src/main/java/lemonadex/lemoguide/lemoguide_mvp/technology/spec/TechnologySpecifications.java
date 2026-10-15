package lemonadex.lemoguide.lemoguide_mvp.technology.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;

public final class TechnologySpecifications {

    private TechnologySpecifications() {
    }

    /** Case-insensitive match of {@code keyword} against name OR description OR category. */
    public static Specification<Technology> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("category")), like),
                cb.like(cb.lower(root.get("description")), like));
    }

    public static Specification<Technology> nameContains(String name) {
        if (!StringUtils.hasText(name)) {
            return Specification.unrestricted();
        }
        String like = "%" + name.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), like);
    }

    public static Specification<Technology> categoryEquals(String category) {
        if (!StringUtils.hasText(category) || "all".equalsIgnoreCase(category)) {
            return Specification.unrestricted();
        }
        String term = category.trim().toLowerCase();
        return (root, query, cb) -> {
            var catPath = cb.lower(root.get("category"));
            var exact = cb.equal(catPath, term);
            var contains = cb.like(catPath, "%" + term + "%");

            if (term.contains("ai") || term.contains("machine")) {
                return cb.or(
                    exact,
                    contains,
                    cb.like(catPath, "%data science%"),
                    cb.like(catPath, "%machine learning%"),
                    cb.like(catPath, "%ai%")
                );
            }
            if (term.contains("devops") || term.contains("cloud")) {
                return cb.or(
                    exact,
                    contains,
                    cb.like(catPath, "%cloud%"),
                    cb.like(catPath, "%ci/cd%"),
                    cb.like(catPath, "%container%"),
                    cb.like(catPath, "%orchestration%"),
                    cb.like(catPath, "%devops%")
                );
            }
            if (term.contains("tool") || term.contains("utility")) {
                return cb.or(
                    exact,
                    contains,
                    cb.like(catPath, "%tool%"),
                    cb.like(catPath, "%version control%"),
                    cb.like(catPath, "%build%"),
                    cb.like(catPath, "%monitoring%")
                );
            }
            if (term.contains("data") || term.contains("db") || term.contains("database")) {
                return cb.or(
                    exact,
                    contains,
                    cb.like(catPath, "%database%")
                );
            }
            if (term.contains("front")) {
                return cb.or(exact, contains, cb.like(catPath, "%frontend%"));
            }
            if (term.contains("back")) {
                return cb.or(exact, contains, cb.like(catPath, "%backend%"));
            }
            if (term.contains("mobile")) {
                return cb.or(exact, contains, cb.like(catPath, "%mobile%"));
            }
            if (term.contains("language") || term.contains("ngôn ngữ")) {
                return cb.or(exact, contains, cb.like(catPath, "%programming language%"));
            }
            return cb.or(exact, contains);
        };
    }
}
