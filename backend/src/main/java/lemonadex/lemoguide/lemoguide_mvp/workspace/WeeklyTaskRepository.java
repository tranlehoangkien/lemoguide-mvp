package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface WeeklyTaskRepository extends JpaRepository<WeeklyTask, Long> {
    Optional<WeeklyTask> findByIdAndAccountId(Long id, Long accountId);
    long countByAccountId(Long accountId);
    long countByAccountIdAndCompletedTrue(Long accountId);
    Optional<WeeklyTask> findFirstByAccountIdAndCompletedTrueOrderByCompletedAtDescIdDesc(Long accountId);
    @Query("select t from WeeklyTask t where t.accountId = :owner and ((t.dueDate >= :start and t.dueDate < :end) or (t.completedAt >= :from and t.completedAt < :until)) order by t.dueDate, t.id")
    List<WeeklyTask> week(Long owner, LocalDate start, LocalDate end, LocalDateTime from, LocalDateTime until);
    List<WeeklyTask> findTop20ByAccountIdAndCompletedFalseAndDueDateBeforeOrderByDueDateAscIdAsc(Long accountId, LocalDate date);
    long countByAccountIdAndCompletedFalseAndDueDateBefore(Long accountId, LocalDate date);
}
