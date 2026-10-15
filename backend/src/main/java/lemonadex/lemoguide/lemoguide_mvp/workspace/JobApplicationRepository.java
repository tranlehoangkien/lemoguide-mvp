package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByIdAndAccountId(Long id, Long accountId);
    Optional<JobApplication> findByAccountIdAndJobPostingId(Long accountId, Long jobPostingId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from JobApplication a where a.id = :id and a.accountId = :owner")
    Optional<JobApplication> lockOwned(Long id, Long owner);
    @Query("select a from JobApplication a where a.accountId = :owner and (:status is null or a.status = :status) and (lower(a.title) like :search escape '!' or lower(a.company) like :search escape '!')")
    Page<JobApplication> search(Long owner, JobApplication.Status status, String search, Pageable pageable);
    @Query("select a.status, count(a) from JobApplication a where a.accountId = :owner group by a.status")
    List<Object[]> counts(Long owner);
    @Query("select a from JobApplication a where a.accountId = :owner and a.nextActionAt < :end and a.status in :statuses order by a.nextActionAt, a.id")
    List<JobApplication> upcoming(Long owner, java.time.LocalDateTime end, Collection<JobApplication.Status> statuses, Pageable pageable);
}
