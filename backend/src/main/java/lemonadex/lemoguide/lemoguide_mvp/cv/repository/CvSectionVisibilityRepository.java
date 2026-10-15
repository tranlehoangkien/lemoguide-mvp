package lemonadex.lemoguide.lemoguide_mvp.cv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvSectionVisibility;

public interface CvSectionVisibilityRepository extends JpaRepository<CvSectionVisibility, Long> {

    List<CvSectionVisibility> findByCvProfileIdOrderByDisplayOrderAsc(Long cvProfileId);

    Optional<CvSectionVisibility> findByCvProfileIdAndSectionName(Long cvProfileId, String sectionName);

    Optional<CvSectionVisibility> findByIdAndCvProfileId(Long id, Long cvProfileId);

    void deleteByCvProfileId(Long cvProfileId);
}
