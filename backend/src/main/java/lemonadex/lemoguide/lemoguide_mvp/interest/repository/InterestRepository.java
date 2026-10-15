package lemonadex.lemoguide.lemoguide_mvp.interest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.interest.entity.Interest;

public interface InterestRepository extends JpaRepository<Interest, Long> {

    Optional<Interest> findByIdAndUserInformationId(Long id, Long userInformationId);

    Page<Interest> findByUserInformationId(Long userInformationId, Pageable pageable);

    List<Interest> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
