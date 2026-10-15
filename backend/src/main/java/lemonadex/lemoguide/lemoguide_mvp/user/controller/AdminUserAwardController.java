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
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardRequest;
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardResponse;
import lemonadex.lemoguide.lemoguide_mvp.award.entity.Award;
import lemonadex.lemoguide.lemoguide_mvp.award.repository.AwardRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of award records for a specific USER account.
 * Supports listing, adding, updating, and removing awards.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/awards")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserAwardController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final AwardRepository awardRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<AwardResponse>> listAwards(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<AwardResponse> responses = awardRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId)
                .stream().map(AwardResponse::from).toList();
        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AwardResponse>> createAward(
            @PathVariable Long userId,
            @Valid @RequestBody AwardRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Award award = awardRepository.save(Award.builder()
                .userInformationId(userInformationId)
                .name(request.name().trim())
                .grantedBy(trimToNull(request.grantedBy()))
                .grantedYear(request.grantedYear())
                .description(trimToNull(request.description()))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Award added", AwardResponse.from(award)));
    }

    @PutMapping("/{awardId}")
    public ApiResponse<AwardResponse> updateAward(
            @PathVariable Long userId,
            @PathVariable Long awardId,
            @Valid @RequestBody AwardRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Award award = awardRepository.findByIdAndUserInformationId(awardId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Award not found"));

        award.setName(request.name().trim());
        award.setGrantedBy(trimToNull(request.grantedBy()));
        award.setGrantedYear(request.grantedYear());
        award.setDescription(trimToNull(request.description()));

        return ApiResponse.success("Award updated", AwardResponse.from(award));
    }

    @DeleteMapping("/{awardId}")
    public ResponseEntity<ApiResponse<Void>> deleteAward(
            @PathVariable Long userId,
            @PathVariable Long awardId) {
        Long userInformationId = getUserInformationId(userId);
        Award award = awardRepository.findByIdAndUserInformationId(awardId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Award not found"));

        awardRepository.delete(award);
        return ResponseEntity.ok(ApiResponse.success("Award removed", null));
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
