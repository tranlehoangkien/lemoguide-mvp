package lemonadex.lemoguide.lemoguide_mvp.discovery;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface DiscoveryRepository extends JpaRepository<DiscoveryAttempt, Long> {
    List<DiscoveryAttempt> findByAccountIdAndKindAndBankVersionAndCompletedAtIsNotNullOrderByCompletedAtAscIdAsc(Long accountId, String kind, String bankVersion);
    List<DiscoveryAttempt> findTop100ByAccountIdOrderByIdDesc(Long accountId);
    Optional<DiscoveryAttempt> findByIdAndAccountId(Long id, Long accountId);
    Optional<DiscoveryAttempt> findFirstByAccountIdAndKindAndCompletedAtIsNullOrderByIdDesc(Long accountId, String kind);
    Optional<DiscoveryAttempt> findFirstByAccountIdAndKindAndCompletedAtIsNotNullOrderByIdDesc(Long accountId, String kind);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from DiscoveryAttempt a where a.id = :id and a.accountId = :accountId")
    Optional<DiscoveryAttempt> lockOwned(@Param("id") Long id, @Param("accountId") Long accountId);
}
