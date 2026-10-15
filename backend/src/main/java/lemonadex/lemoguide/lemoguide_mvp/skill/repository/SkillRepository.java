package lemonadex.lemoguide.lemoguide_mvp.skill.repository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;

public interface SkillRepository extends JpaRepository<Skill, Long>, JpaSpecificationExecutor<Skill> {

    boolean existsByNameIgnoreCaseAndType(String name, SkillType type);

    Optional<Skill> findByNameIgnoreCaseAndType(String name, SkillType type);

    // A locking read sees catalog rows committed while waiting for a technology lock,
    // including under MySQL's default REPEATABLE READ isolation.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from Skill s where lower(s.name) = lower(:name) and s.type = :type")
    Optional<Skill> findLockedByNameIgnoreCaseAndType(String name, SkillType type);

    @org.springframework.data.jpa.repository.Query("select s from Skill s where s.type = :type and lower(s.name) in :names")
    List<Skill> findByTypeAndNamesIgnoreCase(SkillType type, Collection<String> names);
}
