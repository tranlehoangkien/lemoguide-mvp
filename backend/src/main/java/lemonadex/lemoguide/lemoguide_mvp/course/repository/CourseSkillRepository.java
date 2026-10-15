package lemonadex.lemoguide.lemoguide_mvp.course.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseSkill;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseTagView;

public interface CourseSkillRepository extends JpaRepository<CourseSkill, Long> {

    @Query("SELECT DISTINCT new lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseTagView(s.id, s.name) FROM CourseSkill cs JOIN cs.skill s WHERE cs.courseId IN (SELECT c.id FROM Course c WHERE c.isActive = true) ORDER BY s.name")
    List<CourseTagView> findPublishedTags();

    @Query("SELECT cs FROM CourseSkill cs JOIN FETCH cs.skill WHERE cs.courseId IN :courseIds")
    List<CourseSkill> findByCourseIdInWithSkill(@Param("courseIds") Collection<Long> courseIds);
    List<CourseSkill> findByCourseIdIn(Collection<Long> courseIds);

    /** Used by job analysis to find courses that teach a job's missing skills. */
    List<CourseSkill> findBySkillIdIn(Collection<Long> skillIds);

    void deleteByCourseId(Long courseId);
}
