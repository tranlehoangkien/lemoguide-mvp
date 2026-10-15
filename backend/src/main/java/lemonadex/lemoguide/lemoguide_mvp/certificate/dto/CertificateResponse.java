package lemonadex.lemoguide.lemoguide_mvp.certificate.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.certificate.entity.Certificate;

public record CertificateResponse(
        Long id,
        String name,
        String issuedBy,
        Integer issuedYear,
        String credentialUrl,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static CertificateResponse from(Certificate c) {
        return new CertificateResponse(c.getId(), c.getName(), c.getIssuedBy(), c.getIssuedYear(),
                c.getCredentialUrl(), c.getDescription(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
