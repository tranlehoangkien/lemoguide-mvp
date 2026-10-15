package lemonadex.lemoguide.lemoguide_mvp.technology.repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;

public interface TechnologyRepository extends JpaRepository<Technology, Long>, JpaSpecificationExecutor<Technology> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Technology> findByNameIgnoreCase(String name);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Technology t where t.id = :id")
    Optional<Technology> lockById(Long id);

    @Query("select t.id from Technology t where lower(t.name) in :names")
    List<Long> findIdsByNamesIgnoreCase(Collection<String> names);

    @Query("SELECT DISTINCT t.category FROM Technology t WHERE t.category IS NOT NULL ORDER BY t.category ASC")
    List<String> findDistinctCategories();
}
