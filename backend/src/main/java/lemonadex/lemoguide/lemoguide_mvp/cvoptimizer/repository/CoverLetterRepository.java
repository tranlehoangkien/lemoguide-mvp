package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity.CoverLetter;

public interface CoverLetterRepository extends JpaRepository<CoverLetter, Long> {

    Optional<CoverLetter> findByIdAndAccountId(Long id, Long accountId);

    List<CoverLetter> findByAccountIdAndCvProfileIdOrderByUpdatedAtDesc(Long accountId, Long cvProfileId);
}
