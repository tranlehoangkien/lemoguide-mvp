package lemonadex.lemoguide.lemoguide_mvp.auth.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.admin.entity.AdminInformation;
import lemonadex.lemoguide.lemoguide_mvp.admin.repository.AdminInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.AccountResponse;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.AuthResponse;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.LoginRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.RegisterRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.AccountStatus;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Role;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.RoleRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.JwtService;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Registration and login. Registration creates the shared {@code account} row
 * plus the profile row for the requested role ({@code user_information} for USER,
 * {@code admin_information} for ADMIN); login verifies the password and issues a
 * JWT. Both paths return the same {@link AuthResponse}.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final UserInformationRepository userInformationRepository;
    private final AdminInformationRepository adminInformationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {
        return register(request, RoleName.USER);
    }

    @Transactional
    public AuthResponse registerAdmin(RegisterRequest request) {
        return register(request, RoleName.ADMIN);
    }

    private AuthResponse register(RegisterRequest request, RoleName roleName) {
        String email = normalizeEmail(request.email());
        if (accountRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Email is already registered");
        }
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_ERROR,
                        "Role " + roleName + " is not configured"));

        Account account = accountRepository.save(Account.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .status(AccountStatus.ACTIVE)
                .build());

        String fullName = request.fullName().trim();
        if (roleName == RoleName.ADMIN) {
            adminInformationRepository.save(AdminInformation.builder()
                    .accountId(account.getId())
                    .fullName(fullName)
                    .build());
        } else {
            userInformationRepository.save(UserInformation.builder()
                    .accountId(account.getId())
                    .fullName(fullName)
                    .build());
        }

        return issueToken(account);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Account account = accountRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Invalid email or password");
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.ACCESS_DENIED,
                    "This account is " + account.getStatus().name().toLowerCase());
        }

        account.setLastLoginAt(LocalDateTime.now()); // flushed by the transaction
        return issueToken(account);
    }

    private AuthResponse issueToken(Account account) {
        String token = jwtService.generateToken(account);
        return AuthResponse.of(token, jwtService.getExpirationMs(), AccountResponse.from(account));
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
