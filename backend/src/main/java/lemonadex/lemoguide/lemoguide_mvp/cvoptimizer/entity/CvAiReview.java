package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity;

import java.time.LocalDateTime;

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
 * The latest AI review of one CV against one target ("none", a job posting or a
 * pasted JD). Mapped to {@code cv_ai_review} from {@code V30__add_cv_optimizer.sql};
 * at most one row per (CV, target key).
 */
@Entity
@Table(name = "cv_ai_review")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvAiReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cv_profile_id", nullable = false)
    private Long cvProfileId;

    /** 'none' | 'job-<id>' | 'jd-<hash8>'. */
    @Column(name = "target_key", nullable = false, length = 80)
    private String targetKey;

    @Column(name = "model_id")
    private Long modelId;

    /** SHA-256 of the CV text + target text this result was computed from. */
    @Column(name = "input_hash", nullable = false, length = 64)
    private String inputHash;

    @Column(name = "result_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String resultJson;

    @Column(name = "generation_log_id")
    private Long generationLogId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
