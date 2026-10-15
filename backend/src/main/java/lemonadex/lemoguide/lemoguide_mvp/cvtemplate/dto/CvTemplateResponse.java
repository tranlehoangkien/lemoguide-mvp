package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto;

import java.time.LocalDateTime;

import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.CvTemplate;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.Density;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.LayoutType;

public record CvTemplateResponse(
        Long id,
        String name,
        String category,
        String thumbnailUrl,
        String layoutConfig,
        String colorScheme,
        String fontPair,
        LayoutType layoutType,
        Density density,
        String renderKey,
        boolean isPremium,
        boolean isActive,
        Long createdBy,
        long usageCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /** {@code usageCount} is the number of {@code cv_profile} rows currently using this template. */
    public static CvTemplateResponse from(CvTemplate t, long usageCount) {
        return new CvTemplateResponse(t.getId(), t.getName(), t.getCategory(), t.getThumbnailUrl(),
                t.getLayoutConfig(), t.getColorScheme(), t.getFontPair(), t.getLayoutType(), t.getDensity(),
                t.getRenderKey(), t.getIsPremium(), t.getIsActive(), t.getCreatedBy(), usageCount,
                t.getCreatedAt(), t.getUpdatedAt());
    }
}
