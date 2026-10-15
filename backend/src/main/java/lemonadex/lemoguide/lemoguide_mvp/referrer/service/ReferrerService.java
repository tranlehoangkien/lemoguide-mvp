package lemonadex.lemoguide.lemoguide_mvp.referrer.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerRequest;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerResponse;
import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Referrer;
import lemonadex.lemoguide.lemoguide_mvp.referrer.repository.ReferrerRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code referrer} rows, scoped
 * to the caller's {@code user_information} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ReferrerService {

    private final ReferrerRepository referrerRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<ReferrerResponse> list(Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        return referrerRepository.findByUserInformationId(ownerId, pageable).map(ReferrerResponse::from);
    }

    @Transactional(readOnly = true)
    public ReferrerResponse get(Long id) {
        return ReferrerResponse.from(require(id));
    }

    public ReferrerResponse create(ReferrerRequest request) {
        Long ownerId = currentUserProfile.requireId();
        Referrer referrer = referrerRepository.save(Referrer.builder()
                .userInformationId(ownerId)
                .name(request.name().trim())
                .position(trimToNull(request.position()))
                .company(trimToNull(request.company()))
                .contactInfo(trimToNull(request.contactInfo()))
                .visibility(request.visibility())
                .build());
        return ReferrerResponse.from(referrer);
    }

    public ReferrerResponse update(Long id, ReferrerRequest request) {
        Referrer referrer = require(id);
        referrer.setName(request.name().trim());
        referrer.setPosition(trimToNull(request.position()));
        referrer.setCompany(trimToNull(request.company()));
        referrer.setContactInfo(trimToNull(request.contactInfo()));
        referrer.setVisibility(request.visibility());
        return ReferrerResponse.from(referrer);
    }

    public void delete(Long id) {
        referrerRepository.delete(require(id));
    }

    private Referrer require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return referrerRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Referrer not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
