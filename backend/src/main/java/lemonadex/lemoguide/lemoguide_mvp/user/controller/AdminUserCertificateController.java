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
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateRequest;
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateResponse;
import lemonadex.lemoguide.lemoguide_mvp.certificate.entity.Certificate;
import lemonadex.lemoguide.lemoguide_mvp.certificate.repository.CertificateRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of certificate records for a specific USER account.
 * Supports listing, adding, updating, and removing certificates.
 */
@RestController
@RequestMapping("/api/admin/users/{userId}/certificates")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminUserCertificateController {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final CertificateRepository certificateRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<CertificateResponse>> listCertificates(@PathVariable Long userId) {
        Long userInformationId = getUserInformationId(userId);
        List<CertificateResponse> responses = certificateRepository
                .findByUserInformationIdOrderByCreatedAtDesc(userInformationId)
                .stream().map(CertificateResponse::from).toList();
        return ApiResponse.success(responses);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CertificateResponse>> createCertificate(
            @PathVariable Long userId,
            @Valid @RequestBody CertificateRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Certificate certificate = certificateRepository.save(Certificate.builder()
                .userInformationId(userInformationId)
                .name(request.name().trim())
                .issuedBy(trimToNull(request.issuedBy()))
                .issuedYear(request.issuedYear())
                .credentialUrl(trimToNull(request.credentialUrl()))
                .description(trimToNull(request.description()))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certificate added", CertificateResponse.from(certificate)));
    }

    @PutMapping("/{certificateId}")
    public ApiResponse<CertificateResponse> updateCertificate(
            @PathVariable Long userId,
            @PathVariable Long certificateId,
            @Valid @RequestBody CertificateRequest request) {
        Long userInformationId = getUserInformationId(userId);
        Certificate certificate = certificateRepository.findByIdAndUserInformationId(certificateId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Certificate not found"));

        certificate.setName(request.name().trim());
        certificate.setIssuedBy(trimToNull(request.issuedBy()));
        certificate.setIssuedYear(request.issuedYear());
        certificate.setCredentialUrl(trimToNull(request.credentialUrl()));
        certificate.setDescription(trimToNull(request.description()));

        return ApiResponse.success("Certificate updated", CertificateResponse.from(certificate));
    }

    @DeleteMapping("/{certificateId}")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(
            @PathVariable Long userId,
            @PathVariable Long certificateId) {
        Long userInformationId = getUserInformationId(userId);
        Certificate certificate = certificateRepository.findByIdAndUserInformationId(certificateId, userInformationId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Certificate not found"));

        certificateRepository.delete(certificate);
        return ResponseEntity.ok(ApiResponse.success("Certificate removed", null));
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
