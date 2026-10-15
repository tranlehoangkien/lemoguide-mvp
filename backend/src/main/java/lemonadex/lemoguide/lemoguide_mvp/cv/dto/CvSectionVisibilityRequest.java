package lemonadex.lemoguide.lemoguide_mvp.cv.dto;

import jakarta.validation.constraints.NotNull;

/** Upsert payload for one section's visibility/order within a CV. */
public record CvSectionVisibilityRequest(
        @NotNull Boolean isVisible,
        @NotNull Integer displayOrder
) {
}
