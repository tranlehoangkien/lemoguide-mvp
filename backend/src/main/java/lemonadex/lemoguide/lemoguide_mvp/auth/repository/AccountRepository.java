package lemonadex.lemoguide.lemoguide_mvp.auth.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;

/**
 * {@link JpaSpecificationExecutor} enables the Criteria-API search used by the
 * admin "manage admins" / "manage users" screens; see
 * {@code AdminSpecifications} and {@code UserSpecifications}.
 */
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select a from Account a where a.id = :id")
    Optional<Account> lockById(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<Account> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Account> findByIdAndRole_Name(Long id, RoleName roleName);

    long countByRole_Name(RoleName roleName);

    /** Used by the admin dashboard to compute week-over-week new-user growth. */
    long countByRole_NameAndCreatedAtGreaterThanEqual(RoleName roleName, LocalDateTime from);

    long countByRole_NameAndCreatedAtBetween(RoleName roleName, LocalDateTime from, LocalDateTime to);

    /** Used by {@code PlanService.delete} to block deleting a plan still in use. */
    boolean existsByPlanId(Long planId);
}
