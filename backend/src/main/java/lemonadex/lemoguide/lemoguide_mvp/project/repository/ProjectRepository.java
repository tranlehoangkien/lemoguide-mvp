package lemonadex.lemoguide.lemoguide_mvp.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    Optional<Project> findByIdAndUserInformationId(Long id, Long userInformationId);

    List<Project> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
