package lemonadex.lemoguide.lemoguide_mvp.admin.dto;

import java.time.LocalDateTime;

/** One row in the admin admin-account list. */
public record AdminAccountSummary(
        Long id,
        String email,
        String role,
        String status,
        String fullName,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime deletedAt,
        String avatarUrl
) {
    public AdminAccountSummary(Long id, String email, String role, String status, String fullName,
            LocalDateTime lastLoginAt, LocalDateTime createdAt, LocalDateTime deletedAt) {
        this(id, email, role, status, fullName, lastLoginAt, createdAt, deletedAt, null);
    }
}
