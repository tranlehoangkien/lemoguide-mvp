package lemonadex.lemoguide.lemoguide_mvp.referrer.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Referrer;

public interface ReferrerRepository extends JpaRepository<Referrer, Long> {

    Optional<Referrer> findByIdAndUserInformationId(Long id, Long userInformationId);

    Page<Referrer> findByUserInformationId(Long userInformationId, Pageable pageable);

    List<Referrer> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
