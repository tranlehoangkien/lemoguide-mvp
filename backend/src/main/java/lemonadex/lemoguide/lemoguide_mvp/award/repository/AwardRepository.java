package lemonadex.lemoguide.lemoguide_mvp.award.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.award.entity.Award;

public interface AwardRepository extends JpaRepository<Award, Long> {

    Optional<Award> findByIdAndUserInformationId(Long id, Long userInformationId);

    Page<Award> findByUserInformationId(Long userInformationId, Pageable pageable);

    List<Award> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
