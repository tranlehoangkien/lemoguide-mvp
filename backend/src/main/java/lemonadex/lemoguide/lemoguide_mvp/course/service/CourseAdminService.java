package lemonadex.lemoguide.lemoguide_mvp.course.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseRequest;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseResponse;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseTagView;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseSkill;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseTechnology;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.spec.CourseSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code course} catalog (Su nghiep > Khoa hoc de xuat). */
@Service
@Transactional
@RequiredArgsConstructor
public class CourseAdminService {

    private final CourseRepository courseRepository;
    private final CourseSkillRepository courseSkillRepository;
    private final CourseTechnologyRepository courseTechnologyRepository;
    private final SkillRepository skillRepository;
    private final TechnologyRepository technologyRepository;

    @Transactional(readOnly = true)
    public Page<CourseResponse> search(CourseSearchCriteria criteria, Pageable pageable) {
        Specification<Course> spec = Specification.<Course>unrestricted()
                .and(CourseSpecifications.keyword(criteria.keyword()))
                .and(CourseSpecifications.levelEquals(criteria.level()))
                .and(CourseSpecifications.isActiveEquals(criteria.isActive()));

        Page<Course> page = courseRepository.findAll(spec, pageable);
        List<Long> courseIds = page.getContent().stream().map(Course::getId).toList();
        if (courseIds.isEmpty()) {
            return page.map(c -> CourseResponse.from(c, List.of(), List.of()));
        }

        Map<Long, List<CourseTagView>> skillsByCourse = courseSkillRepository.findByCourseIdInWithSkill(courseIds)
                .stream().collect(Collectors.groupingBy(CourseSkill::getCourseId,
                        Collectors.mapping(cs -> new CourseTagView(cs.getSkillId(), cs.getSkill().getName()), Collectors.toList())));
        Map<Long, List<CourseTagView>> techsByCourse = courseTechnologyRepository.findByCourseIdInWithTechnology(courseIds)
                .stream().collect(Collectors.groupingBy(CourseTechnology::getCourseId,
                        Collectors.mapping(ct -> new CourseTagView(ct.getTechnologyId(), ct.getTechnology().getName()), Collectors.toList())));

        return page.map(c -> CourseResponse.from(c,
                skillsByCourse.getOrDefault(c.getId(), List.of()),
                techsByCourse.getOrDefault(c.getId(), List.of())));
    }

    @Transactional(readOnly = true)
    public CourseResponse get(Long id) {
        Course course = require(id);
        return CourseResponse.from(course, tagsOf(course.getId(), true), tagsOf(course.getId(), false));
    }

    public CourseResponse create(CourseRequest request) {
        Course course = courseRepository.save(Course.builder()
                .title(request.title().trim())
                .provider(trimToNull(request.provider()))
                .description(trimToNull(request.description()))
                .url(trimToNull(request.url()))
                .thumbnailUrl(trimToNull(request.thumbnailUrl()))
                .level(request.level())
                .durationHours(request.durationHours())
                .price(request.price())
                .isFree(request.isFree())
                .isActive(request.isActive())
                .createdBy(SecurityUtils.currentAccountId())
                .build());
        List<CourseTagView> skills = syncSkills(course.getId(), request.skillIds());
        List<CourseTagView> techs = syncTechnologies(course.getId(), request.technologyIds());
        return CourseResponse.from(course, skills, techs);
    }

    public CourseResponse update(Long id, CourseRequest request) {
        Course course = require(id);
        course.setTitle(request.title().trim());
        course.setProvider(trimToNull(request.provider()));
        course.setDescription(trimToNull(request.description()));
        course.setUrl(trimToNull(request.url()));
        course.setThumbnailUrl(trimToNull(request.thumbnailUrl()));
        course.setLevel(request.level());
        course.setDurationHours(request.durationHours());
        course.setPrice(request.price());
        course.setIsFree(request.isFree());
        course.setIsActive(request.isActive());
        List<CourseTagView> skills = syncSkills(course.getId(), request.skillIds());
        List<CourseTagView> techs = syncTechnologies(course.getId(), request.technologyIds());
        return CourseResponse.from(course, skills, techs);
    }

    public void delete(Long id) {
        Course course = require(id);
        courseSkillRepository.deleteByCourseId(course.getId());
        courseTechnologyRepository.deleteByCourseId(course.getId());
        courseRepository.delete(course);
    }

    private Course require(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));
    }

    private List<CourseTagView> syncSkills(Long courseId, List<Long> skillIds) {
        List<Long> ids = skillIds == null ? List.of() : skillIds.stream().distinct().toList();
        courseSkillRepository.deleteByCourseId(courseId);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Skill> skills = skillRepository.findAllById(ids);
        if (skills.size() != ids.size()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "One or more skill ids do not exist");
        }
        courseSkillRepository.saveAll(ids.stream()
                .map(skillId -> CourseSkill.builder().courseId(courseId).skillId(skillId).build())
                .toList());
        return skills.stream().map(s -> new CourseTagView(s.getId(), s.getName())).toList();
    }

    private List<CourseTagView> syncTechnologies(Long courseId, List<Long> technologyIds) {
        List<Long> ids = technologyIds == null ? List.of() : technologyIds.stream().distinct().toList();
        courseTechnologyRepository.deleteByCourseId(courseId);
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Technology> techs = technologyRepository.findAllById(ids);
        if (techs.size() != ids.size()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "One or more technology ids do not exist");
        }
        courseTechnologyRepository.saveAll(ids.stream()
                .map(techId -> CourseTechnology.builder().courseId(courseId).technologyId(techId).build())
                .toList());
        return techs.stream().map(t -> new CourseTagView(t.getId(), t.getName())).toList();
    }

    private List<CourseTagView> tagsOf(Long courseId, boolean skills) {
        if (skills) {
            return courseSkillRepository.findByCourseIdInWithSkill(List.of(courseId)).stream()
                    .map(cs -> new CourseTagView(cs.getSkillId(), cs.getSkill().getName())).toList();
        }
        return courseTechnologyRepository.findByCourseIdInWithTechnology(List.of(courseId)).stream()
                .map(ct -> new CourseTagView(ct.getTechnologyId(), ct.getTechnology().getName())).toList();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
