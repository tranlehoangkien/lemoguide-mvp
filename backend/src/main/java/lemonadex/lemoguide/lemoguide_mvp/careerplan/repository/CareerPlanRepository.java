package lemonadex.lemoguide.lemoguide_mvp.careerplan.repository;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerPlan;

public interface CareerPlanRepository extends JpaRepository<CareerPlan, Long> {
    Optional<CareerPlan> findByIdAndAccountId(Long id, Long accountId);
    Page<CareerPlan> findByAccountIdOrderByUpdatedAtDescIdDesc(Long accountId, Pageable pageable);
    boolean existsByAccountId(Long accountId);
}
