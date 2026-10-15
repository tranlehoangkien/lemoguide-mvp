package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvSectionVisibility;

public record CvSectionVisibilityResponse(
        Long id,
        Long cvProfileId,
        String sectionName,
        boolean isVisible,
        Integer displayOrder
) {

    public static CvSectionVisibilityResponse from(CvSectionVisibility v) {
        return new CvSectionVisibilityResponse(v.getId(), v.getCvProfileId(), v.getSectionName(),
                v.getIsVisible(), v.getDisplayOrder());
    }
}
