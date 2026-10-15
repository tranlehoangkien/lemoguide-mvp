package lemonadex.lemoguide.lemoguide_mvp.auth.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Role;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Guarantees a row exists for every {@link RoleName} at startup. Production
 * already gets these from {@code V2__add_role_and_admin_information.sql}; this
 * keeps environments without Flyway (the H2 test profile) and any future new
 * role in sync.
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class RoleInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (RoleName name : RoleName.values()) {
            roleRepository.findByName(name).orElseGet(() -> {
                log.info("Seeding missing role {}", name);
                return roleRepository.save(Role.builder()
                        .name(name)
                        .description(switch (name) {
                            case ADMIN -> "System administrator with full management access";
                            case USER -> "Standard end user building CV profiles";
                        })
                        .build());
            });
        }
    }
}
