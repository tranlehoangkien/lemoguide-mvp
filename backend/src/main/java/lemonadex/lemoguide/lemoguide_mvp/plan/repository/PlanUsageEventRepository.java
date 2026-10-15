package lemonadex.lemoguide.lemoguide_mvp.plan.repository;

import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.PlanUsageEvent;

public interface PlanUsageEventRepository extends JpaRepository<PlanUsageEvent, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.List<PlanUsageEvent> findByAccountIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(Long accountId, LocalDateTime from, LocalDateTime to);
    long countByAccountIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(Long accountId, LocalDateTime from, LocalDateTime to);
    long countByAccountIdAndMessageTrueAndUsedAtGreaterThanEqualAndUsedAtLessThan(Long accountId, LocalDateTime from, LocalDateTime to);
}
