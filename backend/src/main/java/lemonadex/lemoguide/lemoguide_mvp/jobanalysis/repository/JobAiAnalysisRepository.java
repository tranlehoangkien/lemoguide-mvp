package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.entity.JobAiAnalysis;

public interface JobAiAnalysisRepository extends JpaRepository<JobAiAnalysis, Long> {

    Optional<JobAiAnalysis> findByAccountIdAndJobPostingId(Long accountId, Long jobPostingId);
}
