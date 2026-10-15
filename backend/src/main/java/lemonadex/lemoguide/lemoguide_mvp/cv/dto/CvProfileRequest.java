package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.TargetMode;

/**
 * Create / replace payload for a {@code cv_profile}. {@code sharePassword} is
 * write-only plain text (hashed by the service) and left {@code null} to keep
 * any existing password unchanged; pass an empty string to clear it.
 */
public record CvProfileRequest(
        @NotBlank @Size(max = 150) String name,
        @NotNull TargetMode targetMode,
        @NotNull PublishMode publishMode,
        Long templateId,
        String cvData,
        String activeSections,
        String avatarUrl,
        boolean isActive,
        String sharePassword,
        LocalDateTime shareExpiresAt
) {
}
