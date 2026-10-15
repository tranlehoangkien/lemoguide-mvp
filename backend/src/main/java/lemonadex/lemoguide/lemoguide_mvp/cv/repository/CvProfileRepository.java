package lemonadex.lemoguide.lemoguide_mvp.cv.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;

public interface CvProfileRepository extends JpaRepository<CvProfile, Long>, JpaSpecificationExecutor<CvProfile> {

    Optional<CvProfile> findByIdAndUserInformationId(Long id, Long userInformationId);

    Page<CvProfile> findByUserInformationId(Long userInformationId, Pageable pageable);

    Optional<CvProfile> findByPublicSlug(String publicSlug);

    boolean existsByPublicSlug(String publicSlug);

    boolean existsByTemplateId(Long templateId);

    long countByUserInformationId(Long userInformationId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    List<CvProfile> findByUserInformationId(Long userInformationId);

    /** Number of CVs currently using a given template, for the admin template list's "usage_count". */
    long countByTemplateId(Long templateId);

    @Query("SELECT c.templateId AS templateId, COUNT(c) AS cvCount FROM CvProfile c "
            + "WHERE c.templateId IN :templateIds GROUP BY c.templateId")
    List<TemplateUsageCount> countGroupedByTemplateIds(@Param("templateIds") Collection<Long> templateIds);

    interface TemplateUsageCount {
        Long getTemplateId();
        Long getCvCount();
    }

    /** Used by the admin dashboard's "new CVs this period" / growth cards. */
    long countByCreatedAtGreaterThanEqual(LocalDateTime from);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(c.viewCount), 0) FROM CvProfile c")
    long sumViewCount();

    /** Number of CVs owned by each user, used to weight the "top technology" ranking. */
    @Query("SELECT c.userInformationId AS userInformationId, COUNT(c) AS cvCount "
            + "FROM CvProfile c GROUP BY c.userInformationId")
    List<UserCvCount> countCvsGroupedByUser();

    interface UserCvCount {
        Long getUserInformationId();
        Long getCvCount();
    }
}
