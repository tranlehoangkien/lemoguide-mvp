package lemonadex.lemoguide.lemoguide_mvp.user.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Resolves the {@code user_information} row of the currently authenticated
 * caller. Shared by the self-service sub-resources (contacts, education) so they
 * can scope every query to the caller's own profile.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserProfileService {

    private final UserInformationRepository userInformationRepository;

    @Transactional(readOnly = true)
    public UserInformation require() {
        return userInformationRepository.findByAccountId(SecurityUtils.currentAccountId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Your user profile is not set up yet"));
    }

    @Transactional(readOnly = true)
    public Long requireId() {
        return require().getId();
    }
}
