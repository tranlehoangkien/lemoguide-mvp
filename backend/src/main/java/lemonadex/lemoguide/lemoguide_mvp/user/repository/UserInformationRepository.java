package lemonadex.lemoguide.lemoguide_mvp.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;

public interface UserInformationRepository extends JpaRepository<UserInformation, Long> {

    Optional<UserInformation> findByAccountId(Long accountId);

    boolean existsByAccountId(Long accountId);
}
