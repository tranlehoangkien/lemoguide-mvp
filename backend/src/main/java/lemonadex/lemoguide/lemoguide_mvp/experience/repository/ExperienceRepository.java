package lemonadex.lemoguide.lemoguide_mvp.experience.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;

public interface ExperienceRepository extends JpaRepository<Experience, Long>, JpaSpecificationExecutor<Experience> {

    Optional<Experience> findByIdAndUserInformationId(Long id, Long userInformationId);

    List<Experience> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
