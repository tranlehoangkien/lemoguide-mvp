package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.TargetMode;

/**
 * Public view of a shared CV. Deliberately minimal: assembling the full CV
 * content (education, experience, skills, ...) for public rendering is a
 * separate concern outside this migration's scope.
 */
public record PublicCvProfileResponse(
        Long userInformationId,
        String name,
        TargetMode targetMode,
        Integer viewCount
) {

    public static PublicCvProfileResponse from(CvProfile p) {
        return new PublicCvProfileResponse(p.getUserInformationId(), p.getName(), p.getTargetMode(), p.getViewCount());
    }
}
