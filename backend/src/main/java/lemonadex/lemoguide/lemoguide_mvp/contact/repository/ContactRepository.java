package lemonadex.lemoguide.lemoguide_mvp.contact.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;

public interface ContactRepository extends JpaRepository<Contact, Long>, JpaSpecificationExecutor<Contact> {

    Optional<Contact> findByIdAndUserInformationId(Long id, Long userInformationId);

    List<Contact> findByUserInformationIdAndPrimaryIsTrue(Long userInformationId);

    List<Contact> findByUserInformationId(Long userInformationId);

    List<Contact> findByUserInformationIdOrderByPrimaryDescCreatedAtDesc(Long userInformationId);
}
