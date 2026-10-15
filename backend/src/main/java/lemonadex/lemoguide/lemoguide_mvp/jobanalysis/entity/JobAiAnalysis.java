package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.entity;

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
 * The latest AI analysis of one job posting against one account's profile.
 * Mapped to the {@code job_ai_analysis} table from
 * {@code V28__add_job_ai_analysis.sql}; at most one row per (account, job).
 */
@Entity
@Table(name = "job_ai_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "job_posting_id", nullable = false)
    private Long jobPostingId;

    /** Plain id into {@code ai_model}; null once that model is deleted. */
    @Column(name = "model_id")
    private Long modelId;

    /** SHA-256 of the job text + profile snapshot this result was computed from. */
    @Column(name = "input_hash", nullable = false, length = 64)
    private String inputHash;

    /** Normalized {@code JobAnalysisResult} JSON. */
    @Column(name = "result_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String resultJson;

    @Column(name = "generation_log_id")
    private Long generationLogId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
