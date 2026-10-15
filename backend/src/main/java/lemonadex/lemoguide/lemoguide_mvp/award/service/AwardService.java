package lemonadex.lemoguide.lemoguide_mvp.award.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardRequest;
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardResponse;
import lemonadex.lemoguide.lemoguide_mvp.award.entity.Award;
import lemonadex.lemoguide.lemoguide_mvp.award.repository.AwardRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code award} rows, scoped to
 * the caller's {@code user_information} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AwardService {

    private final AwardRepository awardRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<AwardResponse> list(Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        return awardRepository.findByUserInformationId(ownerId, pageable).map(AwardResponse::from);
    }

    @Transactional(readOnly = true)
    public AwardResponse get(Long id) {
        return AwardResponse.from(require(id));
    }

    public AwardResponse create(AwardRequest request) {
        Long ownerId = currentUserProfile.requireId();
        Award award = awardRepository.save(Award.builder()
                .userInformationId(ownerId)
                .name(request.name().trim())
                .grantedBy(trimToNull(request.grantedBy()))
                .grantedYear(request.grantedYear())
                .description(trimToNull(request.description()))
                .build());
        return AwardResponse.from(award);
    }

    public AwardResponse update(Long id, AwardRequest request) {
        Award award = require(id);
        award.setName(request.name().trim());
        award.setGrantedBy(trimToNull(request.grantedBy()));
        award.setGrantedYear(request.grantedYear());
        award.setDescription(trimToNull(request.description()));
        return AwardResponse.from(award);
    }

    public void delete(Long id) {
        awardRepository.delete(require(id));
    }

    private Award require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return awardRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Award not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
