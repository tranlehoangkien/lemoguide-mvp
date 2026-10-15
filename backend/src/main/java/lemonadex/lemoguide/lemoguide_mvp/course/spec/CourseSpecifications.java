package lemonadex.lemoguide.lemoguide_mvp.course.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;

public final class CourseSpecifications {

    private CourseSpecifications() {
    }

    /** Case-insensitive match of {@code keyword} against title OR provider. */
    public static Specification<Course> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), like),
                cb.like(cb.lower(root.get("provider")), like));
    }

    public static Specification<Course> levelEquals(CourseLevel level) {
        if (level == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("level"), level);
    }

    public static Specification<Course> isActiveEquals(Boolean isActive) {
        if (isActive == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("isActive"), isActive);
    }
}
