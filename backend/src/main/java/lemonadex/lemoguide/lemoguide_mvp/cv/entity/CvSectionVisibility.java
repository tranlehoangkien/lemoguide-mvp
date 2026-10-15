package lemonadex.lemoguide.lemoguide_mvp.cv.entity;

import jakarta.persistence.Column;
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
 * Per-section show/hide + ordering for one {@link CvProfile} ("Cau hinh hien
 * thi"). Mapped to the {@code cv_section_visibility} table from
 * {@code V1__create_tables.sql}.
 */
@Entity
@Table(name = "cv_section_visibility")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvSectionVisibility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cv_profile_id", nullable = false)
    private Long cvProfileId;

    @Column(name = "section_name", nullable = false, length = 50)
    private String sectionName;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;
}
