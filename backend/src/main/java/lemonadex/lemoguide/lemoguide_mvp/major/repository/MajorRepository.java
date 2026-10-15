package lemonadex.lemoguide.lemoguide_mvp.major.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;

public interface MajorRepository extends JpaRepository<Major, Long>, JpaSpecificationExecutor<Major> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Major> findByNameIgnoreCase(String name);
}
