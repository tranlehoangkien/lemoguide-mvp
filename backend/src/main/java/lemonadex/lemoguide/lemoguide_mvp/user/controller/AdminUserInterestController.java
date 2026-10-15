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
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestRequest;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestResponse;
import lemonadex.lemoguide.lemoguide_mvp.interest.entity.Interest;
import lemonadex.lemoguide.lemoguide_mvp.interest.repository.InterestRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of personal interest records for a specific USER account.
 * Supports listing, adding, updating, and removing interests.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/interests")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserInterestController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final InterestRepository interestRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<InterestResponse>> listInterests(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<InterestResponse> responses = interestRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId)
                .stream().map(InterestResponse::from).toList();
        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InterestResponse>> createInterest(
            @PathVariable Long userId,
            @Valid @RequestBody InterestRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Interest interest = interestRepository.save(Interest.builder()
                .userInformationId(userInformationId)
                .name(request.name().trim())
                .description(trimToNull(request.description()))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interest added", InterestResponse.from(interest)));
    }

    @PutMapping("/{interestId}")
    public ApiResponse<InterestResponse> updateInterest(
            @PathVariable Long userId,
            @PathVariable Long interestId,
            @Valid @RequestBody InterestRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Interest interest = interestRepository.findByIdAndUserInformationId(interestId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Interest not found"));

        interest.setName(request.name().trim());
        interest.setDescription(trimToNull(request.description()));

        return ApiResponse.success("Interest updated", InterestResponse.from(interest));
    }

    @DeleteMapping("/{interestId}")
    public ResponseEntity<ApiResponse<Void>> deleteInterest(
            @PathVariable Long userId,
            @PathVariable Long interestId) {
        Long userInformationId = getUserInformationId(userId);
        Interest interest = interestRepository.findByIdAndUserInformationId(interestId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Interest not found"));

        interestRepository.delete(interest);
        return ResponseEntity.ok(ApiResponse.success("Interest removed", null));
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
