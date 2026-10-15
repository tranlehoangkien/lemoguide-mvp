package lemonadex.lemoguide.lemoguide_mvp.experience.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lemonadex.lemoguide.lemoguide_mvp.experience.entity.ExperienceTechnology;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.ExperienceTechnologyId;

public interface ExperienceTechnologyRepository
        extends JpaRepository<ExperienceTechnology, ExperienceTechnologyId> {

    List<ExperienceTechnology> findByExperienceId(Long experienceId);

    List<ExperienceTechnology> findByExperienceIdIn(Collection<Long> experienceIds);

    void deleteByExperienceId(Long experienceId);

    /** Used by job matching to build the caller's "technologies I've used" set. */
    @Query("SELECT DISTINCT et.technologyId FROM ExperienceTechnology et, Experience e "
            + "WHERE et.experienceId = e.id AND e.userInformationId = :userInformationId")
    List<Long> findTechnologyIdsByUserInformationId(@Param("userInformationId") Long userInformationId);

    /** Used by the admin dashboard to rank technologies by how many CV owners use them. */
    @Query("SELECT et.technologyId AS technologyId, e.userInformationId AS userInformationId "
            + "FROM ExperienceTechnology et, Experience e WHERE et.experienceId = e.id")
    List<TechnologyUserRow> findTechnologyUserPairs();

    interface TechnologyUserRow {
        Long getTechnologyId();
        Long getUserInformationId();
    }
}
