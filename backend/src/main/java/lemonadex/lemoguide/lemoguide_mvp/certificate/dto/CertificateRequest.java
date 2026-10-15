package lemonadex.lemoguide.lemoguide_mvp.certificate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create / replace payload for one certificate record. */
public record CertificateRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 200) String issuedBy,
        Integer issuedYear,
        @Size(max = 500) String credentialUrl,
        String description
) {
}
