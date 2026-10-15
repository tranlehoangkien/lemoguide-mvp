package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto;

import jakarta.validation.constraints.NotNull;

/** Payload for {@code PATCH /api/admin/cv-templates/{id}/status}. */
public record UpdateCvTemplateStatusRequest(@NotNull Boolean isActive) {
}
