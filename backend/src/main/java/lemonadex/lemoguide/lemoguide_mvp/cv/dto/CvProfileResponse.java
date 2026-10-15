package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.TargetMode;

public record CvProfileResponse(
        Long id,
        Long userInformationId,
        String name,
        TargetMode targetMode,
        PublishMode publishMode,
        Long templateId,
        String cvData,
        String activeSections,
        String avatarUrl,
        String publicSlug,
        boolean sharePasswordProtected,
        LocalDateTime shareExpiresAt,
        boolean isActive,
        Integer viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static CvProfileResponse from(CvProfile p) {
        return new CvProfileResponse(p.getId(), p.getUserInformationId(), p.getName(), p.getTargetMode(),
                p.getPublishMode(), p.getTemplateId(), p.getCvData(), p.getActiveSections(), p.getAvatarUrl(), p.getPublicSlug(),
                p.getSharePasswordHash() != null, p.getShareExpiresAt(), p.getIsActive(), p.getViewCount(),
                p.getCreatedAt(), p.getUpdatedAt());
    }
}
