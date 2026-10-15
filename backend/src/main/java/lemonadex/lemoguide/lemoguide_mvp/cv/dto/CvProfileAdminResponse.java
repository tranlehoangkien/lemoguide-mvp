package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.TargetMode;

/**
 * Admin list/detail view of a {@link CvProfile}, enriched with the owner's name
 * and email (looked up via {@code user_information}/{@code account}) so the
 * "Quan ly CV" table can render an owner column the way {@code
 * UserAccountSummary} does for the user management table.
 */
public record CvProfileAdminResponse(
        Long id,
        Long userInformationId,
        String ownerName,
        String ownerEmail,
        String name,
        TargetMode targetMode,
        PublishMode publishMode,
        Long templateId,
        String templateName,
        String templateRenderKey,
        String publicSlug,
        boolean sharePasswordProtected,
        LocalDateTime shareExpiresAt,
        boolean isActive,
        Integer viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String cvData,
        String activeSections,
        String avatarUrl
) {

    public static CvProfileAdminResponse from(
            CvProfile p, String ownerName, String ownerEmail, String templateName, String templateRenderKey) {
        return new CvProfileAdminResponse(p.getId(), p.getUserInformationId(), ownerName, ownerEmail, p.getName(),
                p.getTargetMode(), p.getPublishMode(), p.getTemplateId(), templateName, templateRenderKey,
                p.getPublicSlug(), p.getSharePasswordHash() != null, p.getShareExpiresAt(), p.getIsActive(),
                p.getViewCount(), p.getCreatedAt(), p.getUpdatedAt(),
                p.getCvData(), p.getActiveSections(), p.getAvatarUrl());
    }
}
