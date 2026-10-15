package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileResponse;

/**
 * @param applied how many changes were written
 * @param skipped one line per change that was not applied (item gone, text edited since, ...)
 * @param versionId the snapshot of the CV taken before the changes, for undo; null when nothing changed
 */
public record CvApplyResponse(int applied, List<String> skipped, Long versionId, CvProfileResponse cv) {
}
