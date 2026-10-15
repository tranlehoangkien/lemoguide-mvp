package lemonadex.lemoguide.lemoguide_mvp.jobdescription.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.jobdescription.entity.JobDescription;

public interface JobDescriptionRepository
        extends JpaRepository<JobDescription, Long>, JpaSpecificationExecutor<JobDescription> {

    Page<JobDescription> findByAccountId(Long accountId, Pageable pageable);

    Optional<JobDescription> findByIdAndAccountId(Long id, Long accountId);
}
