package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity.CvAiReview;

public interface CvAiReviewRepository extends JpaRepository<CvAiReview, Long> {

    Optional<CvAiReview> findByCvProfileIdAndTargetKey(Long cvProfileId, String targetKey);
}
