package lemonadex.lemoguide.lemoguide_mvp.cvversion.entity;

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
 * An immutable snapshot of one {@code cv_profile}, taken on every save so AI
 * edits can be undone / compared. Mapped to the {@code cv_version} table from
 * {@code V6__add_cv_ai_management.sql}.
 */
@Entity
@Table(name = "cv_version")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cv_profile_id", nullable = false)
    private Long cvProfileId;

    /** Raw JSON text: the full CV content at this point in time. */
    @Column(nullable = false, columnDefinition = "JSON")
    private String snapshot;

    @Convert(converter = SnapshotAuthorConverter.class)
    @Column(name = "created_by", nullable = false, length = 10)
    @Builder.Default
    private SnapshotAuthor createdBy = SnapshotAuthor.USER;

    /** Set only when {@link #createdBy} is {@link SnapshotAuthor#AI}. */
    @Column(name = "ai_generation_log_id")
    private Long aiGenerationLogId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
