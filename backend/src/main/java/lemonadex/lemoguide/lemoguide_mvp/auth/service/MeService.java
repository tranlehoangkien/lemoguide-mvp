package lemonadex.lemoguide.lemoguide_mvp.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lemonadex.lemoguide.lemoguide_mvp.admin.entity.AdminInformation;
import lemonadex.lemoguide.lemoguide_mvp.admin.repository.AdminInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.ChangePasswordRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.MeProfileView;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.MeResponse;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateMeRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdatePlanRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.common.storage.AvatarStorageService;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.Plan;
import lemonadex.lemoguide.lemoguide_mvp.plan.repository.PlanRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Self-service for the authenticated caller: read / update the caller's own
 * profile row (in {@code user_information} or {@code admin_information} depending
 * on the account's role) and change the caller's own password.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class MeService {

    private final AccountRepository accountRepository;
    private final UserInformationRepository userInformationRepository;
    private final AdminInformationRepository adminInformationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;
    private final PlanRepository planRepository;

    @Transactional(readOnly = true)
    public MeResponse getCurrent() {
        Account account = currentAccount();
        return toResponse(account, currentProfileView(account));
    }

    public MeResponse updateCurrent(UpdateMeRequest request) {
        Account account = currentAccount();
        MeProfileView view = account.getRole().getName() == RoleName.ADMIN
                ? updateAdminProfile(account.getId(), request)
                : updateUserProfile(account.getId(), request);
        return toResponse(account, view);
    }

    /** Uploads and swaps the caller's avatar, deleting the previous file if it was one of ours. */
    public MeResponse uploadAvatar(MultipartFile file) {
        Account account = currentAccount();
        String avatarUrl = avatarStorageService.store(file);
        MeProfileView view = account.getRole().getName() == RoleName.ADMIN
                ? applyAdminAvatar(account.getId(), avatarUrl)
                : applyUserAvatar(account.getId(), avatarUrl);
        return toResponse(account, view);
    }

    private MeProfileView applyAdminAvatar(Long accountId, String avatarUrl) {
        AdminInformation p = adminInformationRepository.findByAccountId(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        avatarStorageService.deleteIfOwned(p.getAvatarUrl());
        p.setAvatarUrl(avatarUrl);
        return new MeProfileView(p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict(), null, null);
    }

    private MeProfileView applyUserAvatar(Long accountId, String avatarUrl) {
        UserInformation p = userInformationRepository.findByAccountId(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        avatarStorageService.deleteIfOwned(p.getAvatarUrl());
        p.setAvatarUrl(avatarUrl);
        return new MeProfileView(p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict(),
                p.getShortTermGoal(), p.getLongTermGoal());
    }

    /**
     * Self-service plan change - free, immediate, no billing involved. Mirrors
     * the validation in {@code UserAccountService.updateAccount} (admin path).
     */
    public MeResponse updateCurrentPlan(UpdatePlanRequest request) {
        Account account = currentAccount();
        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Plan not found"));
        if (!Boolean.TRUE.equals(plan.getIsActive())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "This plan is not active");
        }
        account.setPlanId(plan.getId());
        return toResponse(account, currentProfileView(account));
    }

    public void changePassword(ChangePasswordRequest request) {
        Account account = currentAccount();
        if (!passwordEncoder.matches(request.currentPassword(), account.getPasswordHash())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Current password is incorrect");
        }
        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    private Account currentAccount() {
        return accountRepository.findById(SecurityUtils.currentAccountId())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED, "Account no longer exists"));
    }

    private MeProfileView currentProfileView(Account account) {
        if (account.getRole().getName() == RoleName.ADMIN) {
            return adminInformationRepository.findByAccountId(account.getId())
                    .map(p -> new MeProfileView(p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                            p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict(), null, null))
                    .orElse(null);
        }
        return userInformationRepository.findByAccountId(account.getId())
                .map(p -> new MeProfileView(p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                        p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict(),
                        p.getShortTermGoal(), p.getLongTermGoal()))
                .orElse(null);
    }

    private MeProfileView updateUserProfile(Long accountId, UpdateMeRequest r) {
        UserInformation p = userInformationRepository.findByAccountId(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        if (r.fullName() != null) {
            p.setFullName(r.fullName().trim());
        }
        if (r.avatarUrl() != null) {
            p.setAvatarUrl(r.avatarUrl());
        }
        if (r.currentTitle() != null) {
            p.setCurrentTitle(r.currentTitle());
        }
        if (r.dateOfBirth() != null) {
            p.setDateOfBirth(r.dateOfBirth());
        }
        if (r.gender() != null) {
            p.setGender(r.gender());
        }
        if (r.city() != null) {
            p.setCity(r.city());
        }
        if (r.district() != null) {
            p.setDistrict(r.district());
        }
        if (r.shortTermGoal() != null) {
            p.setShortTermGoal(r.shortTermGoal());
        }
        if (r.longTermGoal() != null) {
            p.setLongTermGoal(r.longTermGoal());
        }
        return new MeProfileView(p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict(),
                p.getShortTermGoal(), p.getLongTermGoal());
    }

    private MeProfileView updateAdminProfile(Long accountId, UpdateMeRequest r) {
        AdminInformation p = adminInformationRepository.findByAccountId(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        if (r.fullName() != null) {
            p.setFullName(r.fullName().trim());
        }
        if (r.avatarUrl() != null) {
            p.setAvatarUrl(r.avatarUrl());
        }
        if (r.currentTitle() != null) {
            p.setCurrentTitle(r.currentTitle());
        }
        if (r.dateOfBirth() != null) {
            p.setDateOfBirth(r.dateOfBirth());
        }
        if (r.gender() != null) {
            p.setGender(r.gender());
        }
        if (r.city() != null) {
            p.setCity(r.city());
        }
        if (r.district() != null) {
            p.setDistrict(r.district());
        }
        return new MeProfileView(p.getFullName(), p.getAvatarUrl(), p.getCurrentTitle(),
                p.getDateOfBirth(), p.getGender(), p.getCity(), p.getDistrict(), null, null);
    }

    private MeResponse toResponse(Account account, MeProfileView profile) {
        String planName = planRepository.findById(account.getPlanId()).map(Plan::getName).orElse(null);
        return new MeResponse(
                account.getId(),
                account.getEmail(),
                account.getRole().getName().name(),
                account.getStatus().name(),
                account.getLastLoginAt(),
                account.getCreatedAt(),
                account.getPlanId(),
                planName,
                profile);
    }
}
