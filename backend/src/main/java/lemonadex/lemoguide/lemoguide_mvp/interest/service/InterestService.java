package lemonadex.lemoguide.lemoguide_mvp.interest.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestRequest;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestResponse;
import lemonadex.lemoguide.lemoguide_mvp.interest.entity.Interest;
import lemonadex.lemoguide.lemoguide_mvp.interest.repository.InterestRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service CRUD of the current caller's own {@code interest} rows, scoped
 * to the caller's {@code user_information} id.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class InterestService {

    private final InterestRepository interestRepository;
    private final CurrentUserProfileService currentUserProfile;

    @Transactional(readOnly = true)
    public Page<InterestResponse> list(Pageable pageable) {
        Long ownerId = currentUserProfile.requireId();
        return interestRepository.findByUserInformationId(ownerId, pageable).map(InterestResponse::from);
    }

    @Transactional(readOnly = true)
    public InterestResponse get(Long id) {
        return InterestResponse.from(require(id));
    }

    public InterestResponse create(InterestRequest request) {
        Long ownerId = currentUserProfile.requireId();
        Interest interest = interestRepository.save(Interest.builder()
                .userInformationId(ownerId)
                .name(request.name().trim())
                .description(trimToNull(request.description()))
                .build());
        return InterestResponse.from(interest);
    }

    public InterestResponse update(Long id, InterestRequest request) {
        Interest interest = require(id);
        interest.setName(request.name().trim());
        interest.setDescription(trimToNull(request.description()));
        return InterestResponse.from(interest);
    }

    public void delete(Long id) {
        interestRepository.delete(require(id));
    }

    private Interest require(Long id) {
        Long ownerId = currentUserProfile.requireId();
        return interestRepository.findByIdAndUserInformationId(id, ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Interest not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
