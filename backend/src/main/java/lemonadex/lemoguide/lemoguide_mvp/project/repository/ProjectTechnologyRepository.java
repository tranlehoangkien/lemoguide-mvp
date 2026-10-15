package lemonadex.lemoguide.lemoguide_mvp.project.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.project.entity.ProjectTechnology;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.ProjectTechnologyId;

public interface ProjectTechnologyRepository extends JpaRepository<ProjectTechnology, ProjectTechnologyId> {

    List<ProjectTechnology> findByProjectId(Long projectId);

    List<ProjectTechnology> findByProjectIdIn(Collection<Long> projectIds);

    void deleteByProjectId(Long projectId);

    /** Used by job matching to build the caller's "technologies I've used" set. */
    @Query("SELECT DISTINCT pt.technologyId FROM ProjectTechnology pt, Project p "
            + "WHERE pt.projectId = p.id AND p.userInformationId = :userInformationId")
    List<Long> findTechnologyIdsByUserInformationId(@Param("userInformationId") Long userInformationId);

    /** Used by the admin dashboard to rank technologies by how many CV owners use them. */
    @Query("SELECT pt.technologyId AS technologyId, p.userInformationId AS userInformationId "
            + "FROM ProjectTechnology pt, Project p WHERE pt.projectId = p.id")
    List<TechnologyUserRow> findTechnologyUserPairs();

    interface TechnologyUserRow {
        Long getTechnologyId();
        Long getUserInformationId();
    }
}
