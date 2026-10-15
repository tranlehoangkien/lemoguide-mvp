package lemonadex.lemoguide.lemoguide_mvp.userskill.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    Optional<UserSkill> findByIdAndUserInformationId(Long id, Long userInformationId);

    Page<UserSkill> findByUserInformationId(Long userInformationId, Pageable pageable);

    List<UserSkill> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);

    boolean existsByUserInformationIdAndSkillId(Long userInformationId, Long skillId);

    Optional<UserSkill> findByUserInformationIdAndSkillId(Long userInformationId, Long skillId);
}
