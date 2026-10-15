package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto;

import jakarta.validation.constraints.Size;

import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.Density;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.LayoutType;

import jakarta.validation.constraints.NotBlank;

/**
 * Create / replace payload for a {@code cv_template}. {@code layoutConfig} and
 * {@code colorScheme} are raw JSON text. {@code colorScheme}, {@code
 * fontPair}, {@code layoutType} and {@code density} are the fields absorbed
 * from the former {@code theme} table; they are optional so purely
 * generic/layout-only templates can still omit them.
 */
public record CvTemplateRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 100) String category,
        @Size(max = 500) String thumbnailUrl,
        String layoutConfig,
        String colorScheme,
        @Size(max = 100) String fontPair,
        LayoutType layoutType,
        Density density,
        @Size(max = 50) String renderKey,
        boolean isPremium,
        boolean isActive
) {
}
