package lemonadex.lemoguide.lemoguide_mvp.normalization.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

/**
 * Raw, free-text skill/technology names the caller wants matched against the
 * {@code skill}/{@code technology} lookups, or standardized as candidate new
 * entries. Capped at 50 terms per call to keep the prompt (and the model's
 * context) small - this is a manual admin curation tool, not a bulk importer.
 */
public record NormalizeTermsRequest(
        @NotEmpty @Size(max = 50) List<@NotBlank String> rawTerms
) {
}
