package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import jakarta.validation.constraints.NotNull;

/** Self-service plan change for {@code PATCH /api/me/plan} - free, immediate, no billing involved. */
public record UpdatePlanRequest(@NotNull Long planId) {
}
