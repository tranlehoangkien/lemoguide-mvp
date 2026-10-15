package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.CvTemplate;

public interface CvTemplateRepository extends JpaRepository<CvTemplate, Long>, JpaSpecificationExecutor<CvTemplate> {
}
