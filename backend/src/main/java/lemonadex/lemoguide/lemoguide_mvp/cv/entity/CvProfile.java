package lemonadex.lemoguide.lemoguide_mvp.cv.entity;

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
 * A CV owned by a {@code user_information} row ("Engine Hien thi Dong"). Mapped
 * to the {@code cv_profile} table, originally created by
 * {@code V1__create_tables.sql}, extended by {@code V6__add_cv_ai_management.sql}
 * with {@code template_id}, {@code theme_id} and the public-share protection
 * columns, then by {@code V13__merge_theme_into_cv_template.sql} which dropped
 * {@code theme_id} once theme data was folded into {@code cv_template}. Links to
 * sibling tables ({@code cv_template}, {@code user_information}) are kept as
 * plain ids so this package stays independent of theirs.
 */
@Entity
@Table(name = "cv_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_information_id", nullable = false)
    private Long userInformationId;

    @Column(nullable = false, length = 150)
    private String name;

    /**
     * Legacy free-text layout key from V1, kept (deprecated) for backward
     * compatibility with in-flight reads. New code should prefer {@link #templateId}.
     */
    @Column(name = "theme_layout", nullable = false, length = 100)
    @Builder.Default
    private String themeLayout = "sidebar-blue";

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "cv_data", columnDefinition = "json")
    private String cvData;

    @Column(name = "active_sections", columnDefinition = "json")
    private String activeSections;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Convert(converter = TargetModeConverter.class)
    @Column(name = "target_mode", nullable = false, length = 20)
    private TargetMode targetMode;

    @Convert(converter = PublishModeConverter.class)
    @Column(name = "publish_mode", nullable = false, length = 20)
    @Builder.Default
    private PublishMode publishMode = PublishMode.PUBLIC_LINK;

    @Column(name = "public_slug", unique = true, length = 150)
    private String publicSlug;

    @Column(name = "share_password_hash")
    private String sharePasswordHash;

    @Column(name = "share_expires_at")
    private LocalDateTime shareExpiresAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
