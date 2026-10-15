package lemonadex.lemoguide.lemoguide_mvp.cvversion.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.cvversion.entity.CvVersion;

public interface CvVersionRepository extends JpaRepository<CvVersion, Long> {

    Page<CvVersion> findByCvProfileIdOrderByCreatedAtDesc(Long cvProfileId, Pageable pageable);

    Optional<CvVersion> findByIdAndCvProfileId(Long id, Long cvProfileId);
}
