package lemonadex.lemoguide.lemoguide_mvp.education.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;

public interface EducationRepository extends JpaRepository<Education, Long>, JpaSpecificationExecutor<Education> {

    Optional<Education> findByIdAndUserInformationId(Long id, Long userInformationId);

    List<Education> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
