package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

import jakarta.validation.constraints.NotNull;

/** A skill/technology id plus whether it is required, as submitted by the admin form. */
public record TagAssignment(
        @NotNull Long id,
        boolean required
) {
}
