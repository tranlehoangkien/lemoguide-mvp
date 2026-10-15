package lemonadex.lemoguide.lemoguide_mvp.jobposting.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingTechnology;

public interface JobPostingTechnologyRepository extends JpaRepository<JobPostingTechnology, Long> {

    /** Fetches the {@code technology} name eagerly to avoid N+1 when rendering a page of jobs. */
    @Query("SELECT jpt FROM JobPostingTechnology jpt JOIN FETCH jpt.technology WHERE jpt.jobPostingId IN :jobPostingIds")
    List<JobPostingTechnology> findByJobPostingIdInWithTechnology(@Param("jobPostingIds") Collection<Long> jobPostingIds);

    void deleteByJobPostingId(Long jobPostingId);
}
