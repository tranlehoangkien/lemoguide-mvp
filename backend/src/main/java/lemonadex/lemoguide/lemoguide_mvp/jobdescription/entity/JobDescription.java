package lemonadex.lemoguide.lemoguide_mvp.jobdescription.entity;

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
 * A job description pasted by the caller for CV <-> JD matching. Mapped to the
 * {@code job_description} table from {@code V6__add_cv_ai_management.sql}.
 */
@Entity
@Table(name = "job_description")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "cv_profile_id")
    private Long cvProfileId;

    @Column(name = "raw_text", nullable = false, columnDefinition = "TEXT")
    private String rawText;

    /** Raw JSON text: keywords extracted by the (future) AI matching step. */
    @Column(name = "extracted_keywords", columnDefinition = "JSON")
    private String extractedKeywords;

    /** 0-100, set once matching has run. */
    @Column(name = "match_score")
    private Integer matchScore;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
