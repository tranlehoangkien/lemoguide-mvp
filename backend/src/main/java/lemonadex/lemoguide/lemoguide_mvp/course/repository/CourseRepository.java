package lemonadex.lemoguide.lemoguide_mvp.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;

public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
    @Query("select distinct c.provider from Course c where c.isActive = true and c.provider is not null and trim(c.provider) <> '' order by c.provider")
    List<String> findPublishedProviders();
}
