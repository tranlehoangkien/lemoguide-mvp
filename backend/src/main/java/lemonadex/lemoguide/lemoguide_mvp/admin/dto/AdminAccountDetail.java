package lemonadex.lemoguide.lemoguide_mvp.admin.dto;

import java.time.LocalDateTime;

/** Full view of one ADMIN account: credentials metadata plus the profile row. */
public record AdminAccountDetail(
        Long id,
        String email,
        String role,
        String status,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt,
        AdminProfileView profile
) {
}
