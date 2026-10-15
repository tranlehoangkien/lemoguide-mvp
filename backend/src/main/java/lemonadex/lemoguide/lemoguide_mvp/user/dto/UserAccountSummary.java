package lemonadex.lemoguide.lemoguide_mvp.user.dto;

import java.time.LocalDateTime;

/** One row in the admin user-account list with primary contact summary. */
public record UserAccountSummary(
        Long id,
        String email,
        String role,
        String status,
        String fullName,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime deletedAt,
        String primaryContact,
        String primaryContactType,
        Integer contactCount,
        String avatarUrl
) {
    public UserAccountSummary(Long id, String email, String role, String status, String fullName,
            LocalDateTime lastLoginAt, LocalDateTime createdAt, LocalDateTime deletedAt,
            String primaryContact, String primaryContactType, Integer contactCount) {
        this(id, email, role, status, fullName, lastLoginAt, createdAt, deletedAt, primaryContact, primaryContactType, contactCount, null);
    }

    public UserAccountSummary(Long id, String email, String role, String status, String fullName,
            LocalDateTime lastLoginAt, LocalDateTime createdAt, LocalDateTime deletedAt) {
        this(id, email, role, status, fullName, lastLoginAt, createdAt, deletedAt, null, null, 0, null);
    }
}
