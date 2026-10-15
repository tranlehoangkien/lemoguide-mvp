package lemonadex.lemoguide.lemoguide_mvp.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Role;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);
}
