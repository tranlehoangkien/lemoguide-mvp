package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An admin-managed CV template — merged from the former separate {@code
 * cv_template} + {@code theme} tables by {@code
 * V13__merge_theme_into_cv_template.sql} so one row now owns both the
 * structural layout ({@code layout_config}, {@code render_key}) and the visual
 * theme ({@code color_scheme}, {@code font_pair}, {@code layout_type}, {@code
 * density}). Referenced by {@code cv_profile.template_id} as a plain id to
 * keep the cv package independent of this one.
 */
@Entity
@Table(name = "cv_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    /** e.g. IT, Marketing, Sinh vien. */
    @Column(length = 100)
    private String category;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    /** Raw JSON text: column count, spacing defaults, etc. Generic templates only. */
    @Column(name = "layout_config", columnDefinition = "JSON")
    private String layoutConfig;

    /** Raw JSON text, e.g. {@code {"primary":"#2563EB","secondary":"#1E3A8A"}}. */
    @Column(name = "color_scheme", columnDefinition = "JSON")
    private String colorScheme;

    @Column(name = "font_pair", length = 100)
    private String fontPair;

    @Convert(converter = LayoutTypeConverter.class)
    @Column(name = "layout_type", length = 20)
    @Builder.Default
    private LayoutType layoutType = LayoutType.SINGLE;

    @Convert(converter = DensityConverter.class)
    @Column(length = 20)
    @Builder.Default
    private Density density = Density.NORMAL;

    /**
     * Identifies the bespoke frontend React component that renders this
     * template pixel-for-pixel (e.g. {@code green-sidebar}). {@code NULL} for
     * templates still driven purely by the generic {@link #layoutConfig}.
     */
    @Column(name = "render_key", length = 50)
    private String renderKey;

    @Column(name = "is_premium", nullable = false)
    @Builder.Default
    private Boolean isPremium = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** Plain id into {@code account} (the admin who created this template). */
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
