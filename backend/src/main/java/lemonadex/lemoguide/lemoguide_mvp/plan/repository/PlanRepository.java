package lemonadex.lemoguide.lemoguide_mvp.plan.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.plan.entity.Plan;

public interface PlanRepository extends JpaRepository<Plan, Long>, JpaSpecificationExecutor<Plan> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Plan> findByNameIgnoreCase(String name);

    /** For the self-service "choose a plan" selector - active plans only, cheapest first. */
    List<Plan> findByIsActiveTrueOrderByPriceAsc();
}
