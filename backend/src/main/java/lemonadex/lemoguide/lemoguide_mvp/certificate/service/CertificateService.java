package lemonadex.lemoguide.lemoguide_mvp.certificate.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateRequest;
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateResponse;
import lemonadex.lemoguide.lemoguide_mvp.certificate.entity.Certificate;
import lemonadex.lemoguide.lemoguide_mvp.certificate.repository.CertificateRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code certificate} rows,
 * scoped to the caller's {@code user_information} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<CertificateResponse> list(Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        return certificateRepository.findByUserInformationId(ownerId, pageable).map(CertificateResponse::from);
    }

    @Transactional(readOnly = true)
    public CertificateResponse get(Long id) {
        return CertificateResponse.from(require(id));
    }

    public CertificateResponse create(CertificateRequest request) {
        Long ownerId = currentUserProfile.requireId();
        Certificate certificate = certificateRepository.save(Certificate.builder()
                .userInformationId(ownerId)
                .name(request.name().trim())
                .issuedBy(trimToNull(request.issuedBy()))
                .issuedYear(request.issuedYear())
                .credentialUrl(trimToNull(request.credentialUrl()))
                .description(trimToNull(request.description()))
                .build());
        return CertificateResponse.from(certificate);
    }

    public CertificateResponse update(Long id, CertificateRequest request) {
        Certificate certificate = require(id);
        certificate.setName(request.name().trim());
        certificate.setIssuedBy(trimToNull(request.issuedBy()));
        certificate.setIssuedYear(request.issuedYear());
        certificate.setCredentialUrl(trimToNull(request.credentialUrl()));
        certificate.setDescription(trimToNull(request.description()));
        return CertificateResponse.from(certificate);
    }

    public void delete(Long id) {
        certificateRepository.delete(require(id));
    }

    private Certificate require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return certificateRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Certificate not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
