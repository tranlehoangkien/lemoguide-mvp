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
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerRequest;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerResponse;
import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Referrer;
import lemonadex.lemoguide.lemoguide_mvp.referrer.repository.ReferrerRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of referrer records for a specific USER account.
 * Supports listing, adding, updating, and removing referrers.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/referrers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserReferrerController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final ReferrerRepository referrerRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<ReferrerResponse>> listReferrers(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<ReferrerResponse> responses = referrerRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId)
                .stream().map(ReferrerResponse::from).toList();
        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReferrerResponse>> createReferrer(
            @PathVariable Long userId,
            @Valid @RequestBody ReferrerRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Referrer referrer = referrerRepository.save(Referrer.builder()
                .userInformationId(userInformationId)
                .name(request.name().trim())
                .position(trimToNull(request.position()))
                .company(trimToNull(request.company()))
                .contactInfo(trimToNull(request.contactInfo()))
                .visibility(request.visibility())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Referrer added", ReferrerResponse.from(referrer)));
    }

    @PutMapping("/{referrerId}")
    public ApiResponse<ReferrerResponse> updateReferrer(
            @PathVariable Long userId,
            @PathVariable Long referrerId,
            @Valid @RequestBody ReferrerRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Referrer referrer = referrerRepository.findByIdAndUserInformationId(referrerId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Referrer not found"));

        referrer.setName(request.name().trim());
        referrer.setPosition(trimToNull(request.position()));
        referrer.setCompany(trimToNull(request.company()));
        referrer.setContactInfo(trimToNull(request.contactInfo()));
        referrer.setVisibility(request.visibility());

        return ApiResponse.success("Referrer updated", ReferrerResponse.from(referrer));
    }

    @DeleteMapping("/{referrerId}")
    public ResponseEntity<ApiResponse<Void>> deleteReferrer(
            @PathVariable Long userId,
            @PathVariable Long referrerId) {
        Long userInformationId = getUserInformationId(userId);
        Referrer referrer = referrerRepository.findByIdAndUserInformationId(referrerId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Referrer not found"));

        referrerRepository.delete(referrer);
        return ResponseEntity.ok(ApiResponse.success("Referrer removed", null));
    }

    private Long getUserInformationId(Long userId) {
        accountRepository.findByIdAndRole_Name(userId, RoleName.USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User account not found"));
        UserInformation info = userInformationRepository.findByAccountId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User profile not found"));
        return info.getId();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
