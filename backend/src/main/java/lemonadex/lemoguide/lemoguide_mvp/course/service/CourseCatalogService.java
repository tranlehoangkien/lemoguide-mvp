package lemonadex.lemoguide.lemoguide_mvp.course.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Expression;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseCatalogFilters;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseResponse;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseTagView;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseSkill;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseTechnology;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.spec.CourseSpecifications;
import lombok.RequiredArgsConstructor;

/** Read-only user catalog. Publication filtering applies to every endpoint, including direct URLs. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CourseCatalogService {
    private final CourseRepository courses;
    private final CourseSkillRepository skills;
    private final CourseTechnologyRepository technologies;

    public Page<CourseResponse> search(String keyword, String level, String provider, Boolean isFree,
            Long skillId, Long technologyId, String order, int page, int size) {
        CourseLevel parsedLevel = null;
        if (level != null && !level.isBlank()) {
            try {
                parsedLevel = CourseLevel.valueOf(level.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Cấp độ khóa học không hợp lệ.");
            }
        }
        if (!Set.of("newest", "price_asc", "duration_asc", "title_asc").contains(order)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thứ tự sắp xếp không hợp lệ.");
        }
        Specification<Course> spec = CourseSpecifications.isActiveEquals(true)
                .and(CourseSpecifications.levelEquals(parsedLevel));
        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim().toLowerCase(Locale.ROOT)
                    .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("title")), like, '\\'),
                    cb.like(cb.lower(root.get("provider")), like, '\\')));
        }
        if (provider != null && !provider.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("provider"), provider.trim()));
        }
        if (isFree != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("isFree"), isFree));
        if (skillId != null) spec = spec.and(hasTag(List.of(skillId), true));
        if (technologyId != null) spec = spec.and(hasTag(List.of(technologyId), false));
        spec = spec.and(ordered(order));
        return map(courses.findAll(spec, PageRequest.of(page, size)));
    }

    public CourseResponse get(Long id) {
        Course course = requirePublished(id);
        return CourseResponse.from(course,
                skills.findByCourseIdInWithSkill(List.of(id)).stream().map(s -> new CourseTagView(s.getSkillId(), s.getSkill().getName())).toList(),
                technologies.findByCourseIdInWithTechnology(List.of(id)).stream().map(t -> new CourseTagView(t.getTechnologyId(), t.getTechnology().getName())).toList());
    }

    public CourseCatalogFilters filters() {
        return new CourseCatalogFilters(courses.findPublishedProviders(), skills.findPublishedTags(), technologies.findPublishedTags());
    }

    /** Related means at least one shared catalog tag, not an AI-generated recommendation. */
    public List<CourseResponse> related(Long id) {
        CourseResponse course = get(id);
        List<Long> skillIds = course.skills().stream().map(CourseTagView::id).toList();
        List<Long> technologyIds = course.technologies().stream().map(CourseTagView::id).toList();
        if (skillIds.isEmpty() && technologyIds.isEmpty()) return List.of();
        Specification<Course> shared = (root, query, cb) -> cb.disjunction();
        if (!skillIds.isEmpty()) shared = shared.or(hasTag(skillIds, true));
        if (!technologyIds.isEmpty()) shared = shared.or(hasTag(technologyIds, false));
        return map(courses.findAll(CourseSpecifications.isActiveEquals(true)
                .and((root, query, cb) -> cb.notEqual(root.get("id"), id)).and(shared).and(ordered("newest")),
                PageRequest.of(0, 3))).getContent();
    }

    private Course requirePublished(Long id) {
        return courses.findById(id).filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Khóa học không tồn tại hoặc đã ngừng hiển thị."));
    }

    private Page<CourseResponse> map(Page<Course> page) {
        List<Long> ids = page.map(Course::getId).getContent();
        if (ids.isEmpty()) return page.map(c -> CourseResponse.from(c, List.of(), List.of()));
        Map<Long, List<CourseTagView>> bySkill = skills.findByCourseIdInWithSkill(ids).stream()
                .collect(Collectors.groupingBy(CourseSkill::getCourseId,
                        Collectors.mapping(s -> new CourseTagView(s.getSkillId(), s.getSkill().getName()), Collectors.toList())));
        Map<Long, List<CourseTagView>> byTech = technologies.findByCourseIdInWithTechnology(ids).stream()
                .collect(Collectors.groupingBy(CourseTechnology::getCourseId,
                        Collectors.mapping(t -> new CourseTagView(t.getTechnologyId(), t.getTechnology().getName()), Collectors.toList())));
        return page.map(c -> CourseResponse.from(c, bySkill.getOrDefault(c.getId(), List.of()), byTech.getOrDefault(c.getId(), List.of())));
    }

    private static Specification<Course> hasTag(List<Long> ids, boolean skill) {
        return (root, query, cb) -> {
            var sub = query.subquery(Long.class);
            if (skill) {
                var tag = sub.from(CourseSkill.class);
                sub.select(tag.get("courseId")).where(tag.get("skillId").in(ids));
            } else {
                var tag = sub.from(CourseTechnology.class);
                sub.select(tag.get("courseId")).where(tag.get("technologyId").in(ids));
            }
            return root.get("id").in(sub);
        };
    }

    private static Specification<Course> ordered(String order) {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                Expression<BigDecimal> price = cb.<BigDecimal>selectCase().when(cb.isTrue(root.get("isFree")), BigDecimal.ZERO)
                        .otherwise(cb.coalesce(root.get("price"), new BigDecimal("9999999999")));
                query.orderBy(switch (order) {
                    case "price_asc" -> cb.asc(price);
                    case "duration_asc" -> cb.asc(cb.coalesce(root.<Integer>get("durationHours"), Integer.MAX_VALUE));
                    case "title_asc" -> cb.asc(cb.lower(root.get("title")));
                    default -> cb.desc(root.get("createdAt"));
                }, cb.desc(root.get("id")));
            }
            return cb.conjunction();
        };
    }
}
