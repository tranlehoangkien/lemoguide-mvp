package lemonadex.lemoguide.lemoguide_mvp.course.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseTechnology;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseTagView;

public interface CourseTechnologyRepository extends JpaRepository<CourseTechnology, Long> {

    @Query("SELECT DISTINCT new lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseTagView(t.id, t.name) FROM CourseTechnology ct JOIN ct.technology t WHERE ct.courseId IN (SELECT c.id FROM Course c WHERE c.isActive = true) ORDER BY t.name")
    List<CourseTagView> findPublishedTags();

    @Query("SELECT ct FROM CourseTechnology ct JOIN FETCH ct.technology WHERE ct.courseId IN :courseIds")
    List<CourseTechnology> findByCourseIdInWithTechnology(@Param("courseIds") Collection<Long> courseIds);
    List<CourseTechnology> findByCourseIdIn(Collection<Long> courseIds);

    /** Used by job analysis to find courses that teach a job's missing technologies. */
    List<CourseTechnology> findByTechnologyIdIn(Collection<Long> technologyIds);

    void deleteByCourseId(Long courseId);
}
