package lemonadex.lemoguide.lemoguide_mvp.jobposting.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPosting;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long>, JpaSpecificationExecutor<JobPosting> {

    /** Distinct locations of active postings, used to populate the filter dropdown. */
    @Query("SELECT DISTINCT jp.location FROM JobPosting jp WHERE jp.status = lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingStatus.ACTIVE "
            + "AND jp.location IS NOT NULL ORDER BY jp.location")
    List<String> findDistinctActiveLocations();
}
