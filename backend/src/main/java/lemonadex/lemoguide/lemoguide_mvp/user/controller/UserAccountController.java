package lemonadex.lemoguide.lemoguide_mvp.user.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateAccountRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.CreateUserRequest;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UpdateUserProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserAccountDetail;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserAccountSummary;
import lemonadex.lemoguide.lemoguide_mvp.user.dto.UserSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.user.service.UserAccountService;
import lombok.RequiredArgsConstructor;

/** Admin management of USER accounts. */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserAccountController {

    private final UserAccountService userAccountService;

    @GetMapping
    public ApiResponse<PageResponse<UserAccountSummary>> list(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserAccountSummary> page = userAccountService.list(
                new UserSearchCriteria(status, search, includeDeleted), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserAccountDetail>> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User account created", userAccountService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserAccountDetail> get(@PathVariable Long id) {
        return ApiResponse.success(userAccountService.get(id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<UserAccountDetail> updateAccount(@PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request) {
        return ApiResponse.success("Account updated", userAccountService.updateAccount(id, request));
    }

    @PatchMapping("/{id}/profile")
    public ApiResponse<UserAccountDetail> updateProfile(@PathVariable Long id,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        return ApiResponse.success("Profile updated", userAccountService.updateProfile(id, request));
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserAccountDetail> uploadAvatar(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Avatar updated", userAccountService.uploadAvatar(id, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id) {
        userAccountService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("User account deactivated", null));
    }

    @PostMapping("/{id}/restore")
    public ApiResponse<UserAccountDetail> restore(@PathVariable Long id) {
        return ApiResponse.success("User account restored", userAccountService.restore(id));
    }
}
