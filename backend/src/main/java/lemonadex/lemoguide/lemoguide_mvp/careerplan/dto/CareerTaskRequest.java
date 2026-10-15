package lemonadex.lemoguide.lemoguide_mvp.careerplan.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Explicit state makes repeated saves idempotent; never toggle state on the server. */
public record CareerTaskRequest(@NotNull Boolean completed, @Size(max = 2000) String notes) {
}
