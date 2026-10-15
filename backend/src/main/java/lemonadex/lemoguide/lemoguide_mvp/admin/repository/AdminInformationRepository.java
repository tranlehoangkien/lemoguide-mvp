package lemonadex.lemoguide.lemoguide_mvp.admin.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.admin.entity.AdminInformation;

public interface AdminInformationRepository extends JpaRepository<AdminInformation, Long> {

    Optional<AdminInformation> findByAccountId(Long accountId);

    boolean existsByAccountId(Long accountId);
}
