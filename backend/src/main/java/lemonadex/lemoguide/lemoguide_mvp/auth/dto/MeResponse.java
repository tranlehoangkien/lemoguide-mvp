package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import java.time.LocalDateTime;

/** The authenticated caller's own account plus profile, for {@code GET /api/me}. */
public record MeResponse(
        Long id,
        String email,
        String role,
        String status,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        Long planId,
        String planName,
        MeProfileView profile
) {
}
