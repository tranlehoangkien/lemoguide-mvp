package lemonadex.lemoguide.lemoguide_mvp.admin.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminAccountDetail;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminAccountSummary;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.CreateAdminRequest;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.UpdateAdminProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.admin.service.AdminAccountService;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateAccountRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Admin management of ADMIN accounts. */
@RestController
@RequestMapping("/api/admin/admins")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    @GetMapping
    public ApiResponse<PageResponse<AdminAccountSummary>> list(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AdminAccountSummary> page = adminAccountService.list(
                new AdminSearchCriteria(status, search, includeDeleted), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminAccountDetail>> create(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin account created", adminAccountService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminAccountDetail> get(@PathVariable Long id) {
        return ApiResponse.success(adminAccountService.get(id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<AdminAccountDetail> updateAccount(@PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request) {
        return ApiResponse.success("Account updated", adminAccountService.updateAccount(id, request));
    }

    @PatchMapping("/{id}/profile")
    public ApiResponse<AdminAccountDetail> updateProfile(@PathVariable Long id,
            @Valid @RequestBody UpdateAdminProfileRequest request) {
        return ApiResponse.success("Profile updated", adminAccountService.updateProfile(id, request));
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AdminAccountDetail> uploadAvatar(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Avatar updated", adminAccountService.uploadAvatar(id, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id) {
        adminAccountService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Admin account deactivated", null));
    }

    @PostMapping("/{id}/restore")
    public ApiResponse<AdminAccountDetail> restore(@PathVariable Long id) {
        return ApiResponse.success("Admin account restored", adminAccountService.restore(id));
    }
}
