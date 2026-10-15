package lemonadex.lemoguide.lemoguide_mvp.admin.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminAccountDetail;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminAccountSummary;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminProfileView;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.AdminSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.CreateAdminRequest;
import lemonadex.lemoguide.lemoguide_mvp.admin.dto.UpdateAdminProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.admin.entity.AdminInformation;
import lemonadex.lemoguide.lemoguide_mvp.admin.repository.AdminInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.admin.spec.AdminSpecifications;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateAccountRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Role;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.RoleRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.common.storage.AvatarStorageService;
import lombok.RequiredArgsConstructor;

/**
 * Admin management of ADMIN accounts and their {@code admin_information} profile.
 * Same operations as {@code UserAccountService} but scoped to
 * {@link RoleName#ADMIN}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AdminAccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final AdminInformationRepository adminInformationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;

    @Transactional(readOnly = true)
    public Page<AdminAccountSummary> list(AdminSearchCriteria criteria, Pageable pageable) {
        Specification<Account> spec = Specification.<Account>unrestricted()
                .and(AdminSpecifications.isAdmin())
                .and(AdminSpecifications.hasStatus(criteria.status()))
                .and(AdminSpecifications.includeDeleted(criteria.includeDeleted()))
                .and(AdminSpecifications.emailContains(criteria.search()));
        return accountRepository.findAll(spec, pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public AdminAccountDetail get(Long id) {
        return toDetail(requireAdminAccount(id));
    }

    public AdminAccountDetail create(CreateAdminRequest request) {
        String email = request.email().trim().toLowerCase();
        if (accountRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Email is already registered");
        }
        Role role = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_ERROR, "Role ADMIN is not configured"));

        Account account = accountRepository.save(Account.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .status(AccountStatus.ACTIVE)
                .build());

        adminInformationRepository.save(AdminInformation.builder()
                .accountId(account.getId())
                .fullName(request.fullName().trim())
                .build());

        return toDetail(account);
    }

    public AdminAccountDetail updateAccount(Long id, UpdateAccountRequest request) {
        Account account = requireAdminAccount(id);
        if (request.status() != null) {
            account.setStatus(request.status());
        }
        if (request.role() != null && request.role() != account.getRole().getName()) {
            Role role = roleRepository.findByName(request.role())
                    .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "Unknown role " + request.role()));
            account.setRole(role);
        }
        return toDetail(account);
    }

    public AdminAccountDetail updateProfile(Long id, UpdateAdminProfileRequest r) {
        Account account = requireAdminAccount(id);
        AdminInformation p = adminInformationRepository.findByAccountId(account.getId())
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
        return toDetail(account);
    }

    public AdminAccountDetail uploadAvatar(Long id, MultipartFile file) {
        Account account = requireAdminAccount(id);
        AdminInformation p = adminInformationRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Profile not found"));
        String avatarUrl = avatarStorageService.store(file);
        avatarStorageService.deleteIfOwned(p.getAvatarUrl());
        p.setAvatarUrl(avatarUrl);
        return toDetail(account);
    }

    public void softDelete(Long id) {
        Account account = requireAdminAccount(id);
        if (account.getDeletedAt() == null) {
            account.setDeletedAt(LocalDateTime.now());
        }
        account.setStatus(AccountStatus.INACTIVE);
    }

    public AdminAccountDetail restore(Long id) {
        Account account = accountRepository.findByIdAndRole_Name(id, RoleName.ADMIN)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Admin account not found"));
        account.setDeletedAt(null);
        account.setStatus(AccountStatus.ACTIVE);
        return toDetail(account);
    }

    private Account requireAdminAccount(Long id) {
        return accountRepository.findByIdAndRole_Name(id, RoleName.ADMIN)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Admin account not found"));
    }

    private AdminAccountSummary toSummary(Account a) {
        AdminInformation info = adminInformationRepository.findByAccountId(a.getId()).orElse(null);
        String fullName = info != null ? info.getFullName() : null;
        String avatarUrl = info != null ? info.getAvatarUrl() : null;
        return new AdminAccountSummary(a.getId(), a.getEmail(), a.getRole().getName().name(),
                a.getStatus().name(), fullName, a.getLastLoginAt(), a.getCreatedAt(), a.getDeletedAt(), avatarUrl);
    }

    private AdminAccountDetail toDetail(Account a) {
        AdminProfileView profile = adminInformationRepository.findByAccountId(a.getId())
                .map(AdminProfileView::from)
                .orElse(null);
        return new AdminAccountDetail(a.getId(), a.getEmail(), a.getRole().getName().name(), a.getStatus().name(),
                a.getLastLoginAt(), a.getCreatedAt(), a.getUpdatedAt(), a.getDeletedAt(), profile);
    }
}
