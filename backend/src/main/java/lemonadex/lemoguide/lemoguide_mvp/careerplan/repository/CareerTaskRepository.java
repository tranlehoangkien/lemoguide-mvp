package lemonadex.lemoguide.lemoguide_mvp.careerplan.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask;

public interface CareerTaskRepository extends JpaRepository<CareerTask, Long> {
    List<CareerTask> findByPlanIdOrderByWeekNumberAsc(Long planId);
    Optional<CareerTask> findByIdAndPlanId(Long id, Long planId);
    @Query("select t from CareerTask t, CareerPlan p where t.planId = p.id and p.accountId = :accountId order by p.id, t.weekNumber")
    List<CareerTask> findOwnedTasks(Long accountId);
    @Query("select t.planId, count(t), sum(case when t.completed = true then 1 else 0 end) from CareerTask t where t.planId in :ids group by t.planId")
    List<Object[]> countsByPlan(List<Long> ids);
}
