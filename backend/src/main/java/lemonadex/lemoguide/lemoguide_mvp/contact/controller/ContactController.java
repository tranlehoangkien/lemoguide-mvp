package lemonadex.lemoguide.lemoguide_mvp.contact.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactRequest;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactResponse;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.ContactType;
import lemonadex.lemoguide.lemoguide_mvp.contact.service.ContactService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own contact channels. */
@RestController
@RequestMapping("/api/me/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public ApiResponse<PageResponse<ContactResponse>> list(
            @RequestParam(required = false) ContactType type,
            @RequestParam(required = false) Boolean primary,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ContactResponse> page = contactService.search(
                new ContactSearchCriteria(type, primary, search), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ContactResponse>> create(@Valid @RequestBody ContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contact added", contactService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<ContactResponse> get(@PathVariable Long id) {
        return ApiResponse.success(contactService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<ContactResponse> update(@PathVariable Long id, @Valid @RequestBody ContactRequest request) {
        return ApiResponse.success("Contact updated", contactService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        contactService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Contact removed", null));
    }
}
