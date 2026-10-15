package lemonadex.lemoguide.lemoguide_mvp.jobposting.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingSkill;

public interface JobPostingSkillRepository extends JpaRepository<JobPostingSkill, Long> {

    /** Fetches the {@code skill} name eagerly to avoid N+1 when rendering a page of jobs. */
    @Query("SELECT jps FROM JobPostingSkill jps JOIN FETCH jps.skill WHERE jps.jobPostingId IN :jobPostingIds")
    List<JobPostingSkill> findByJobPostingIdInWithSkill(@Param("jobPostingIds") Collection<Long> jobPostingIds);

    void deleteByJobPostingId(Long jobPostingId);
}
