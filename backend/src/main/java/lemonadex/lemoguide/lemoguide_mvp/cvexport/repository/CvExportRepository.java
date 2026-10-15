package lemonadex.lemoguide.lemoguide_mvp.cvexport.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.cvexport.entity.CvExport;

public interface CvExportRepository extends JpaRepository<CvExport, Long>, JpaSpecificationExecutor<CvExport> {

    Page<CvExport> findByAccountId(Long accountId, Pageable pageable);

    Optional<CvExport> findByIdAndAccountId(Long id, Long accountId);
}
