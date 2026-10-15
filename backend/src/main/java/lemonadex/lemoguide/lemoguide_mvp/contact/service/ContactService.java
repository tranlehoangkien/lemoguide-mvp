package lemonadex.lemoguide.lemoguide_mvp.contact.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactRequest;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactResponse;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;
import lemonadex.lemoguide.lemoguide_mvp.contact.repository.ContactRepository;
import lemonadex.lemoguide.lemoguide_mvp.contact.spec.ContactSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code contact} rows. Every
 * operation is scoped to the caller's {@code user_information} id, so one user
 * can never see or touch another user's contacts. Setting a contact as primary
 * clears the primary flag on the caller's other contacts.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<ContactResponse> search(ContactSearchCriteria criteria, Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        Specification<Contact> spec = Specification.<Contact>unrestricted()
                .and(ContactSpecifications.ownedBy(ownerId))
                .and(ContactSpecifications.hasType(criteria.type()))
                .and(ContactSpecifications.isPrimary(criteria.primary()))
                .and(ContactSpecifications.valueContains(criteria.search()));
        return contactRepository.findAll(spec, pageable).map(ContactResponse::from);
    }

    @Transactional(readOnly = true)
    public ContactResponse get(Long id) {
        return ContactResponse.from(require(id));
    }

    public ContactResponse create(ContactRequest request) {
        Long ownerId = currentUserProfile.requireId();
        if (request.primary()) {
            clearExistingPrimary(ownerId);
        }
        Contact contact = contactRepository.save(Contact.builder()
                .userInformationId(ownerId)
                .type(request.type())
                .value(request.value().trim())
                .primary(request.primary())
                .build());
        return ContactResponse.from(contact);
    }

    public ContactResponse update(Long id, ContactRequest request) {
        Contact contact = require(id);
        if (request.primary() && !contact.isPrimary()) {
            clearExistingPrimary(contact.getUserInformationId());
        }
        contact.setType(request.type());
        contact.setValue(request.value().trim());
        contact.setPrimary(request.primary());
        return ContactResponse.from(contact);
    }

    public void delete(Long id) {
        contactRepository.delete(require(id));
    }

    private Contact require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return contactRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Contact not found"));
    }

    private void clearExistingPrimary(Long ownerId) {
        contactRepository.findByUserInformationIdAndPrimaryIsTrue(ownerId)
                .forEach(existing -> existing.setPrimary(false));
    }
}
