package lemonadex.lemoguide.lemoguide_mvp.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactRequest;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactResponse;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;
import lemonadex.lemoguide.lemoguide_mvp.contact.repository.ContactRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of contact channels for a specific USER account.
 * Supports list, create, update, and delete.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/contacts")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserContactController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final ContactRepository contactRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<ContactResponse>> listContacts(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<ContactResponse> contacts = contactRepository
                .findByUserInformationIdOrderByPrimaryDescCreatedAtDesc(userInformationId)
                .stream()
                .map(ContactResponse::from)
                .toList();
        return ApiResponse.success(contacts);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ContactResponse>> createContact(
            @PathVariable Long userId,
            @Valid @RequestBody ContactRequest request) {
        Long userInformationId = getUserInformationId(userId);
        if (request.primary()) {
            clearExistingPrimary(userInformationId);
        }
        Contact contact = contactRepository.save(Contact.builder()
                .userInformationId(userInformationId)
                .type(request.type())
                .value(request.value().trim())
                .primary(request.primary())
                .build());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contact added", ContactResponse.from(contact)));
    }

    @PutMapping("/{contactId}")
    public ApiResponse<ContactResponse> updateContact(
            @PathVariable Long userId,
            @PathVariable Long contactId,
            @Valid @RequestBody ContactRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Contact contact = contactRepository.findByIdAndUserInformationId(contactId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Contact not found"));

        if (request.primary() && !contact.isPrimary()) {
            clearExistingPrimary(userInformationId);
        }

        contact.setType(request.type());
        contact.setValue(request.value().trim());
        contact.setPrimary(request.primary());
        return ApiResponse.success("Contact updated", ContactResponse.from(contact));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(
            @PathVariable Long userId,
            @PathVariable Long contactId) {
        Long userInformationId = getUserInformationId(userId);
        Contact contact = contactRepository.findByIdAndUserInformationId(contactId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Contact not found"));

        contactRepository.delete(contact);
        return ResponseEntity.ok(ApiResponse.success("Contact deleted", null));
    }

    private Long getUserInformationId(Long userId) {
        accountRepository.findByIdAndRole_Name(userId, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        UserInformation info = userInformationRepository.findByAccountId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User profile not found"));
        return info.getId();
    }

    private void clearExistingPrimary(Long userInformationId) {
        contactRepository.findByUserInformationIdAndPrimaryIsTrue(userInformationId)
                .forEach(existing -> existing.setPrimary(false));
    }
}
