package lemonadex.lemoguide.lemoguide_mvp.certificate.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import lemonadex.lemoguide.lemoguide_mvp.certificate.entity.Certificate;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByIdAndUserInformationId(Long id, Long userInformationId);

    Page<Certificate> findByUserInformationId(Long userInformationId, Pageable pageable);

    List<Certificate> findByUserInformationIdOrderByCreatedAtDesc(Long userInformationId);
}
