package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One interview practice session of a user, mapped to {@code interview_session} from
 * {@code V31__add_interview_practice.sql}. {@code contextText} is a snapshot of the CV and target
 * text taken when the session started; the score fields are filled in by code when it is finished.
 */
@Entity
@Table(name = "interview_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    public static final String IN_PROGRESS = "in_progress";
    public static final String COMPLETED = "completed";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "cv_profile_id")
    private Long cvProfileId;

    @Column(name = "job_posting_id")
    private Long jobPostingId;

    /** 'none' | 'job-&lt;id&gt;' | 'jd-&lt;hash8&gt;'. */
    @Column(name = "target_key", nullable = false, length = 80)
    private String targetKey;

    @Column(name = "target_label", nullable = false)
    private String targetLabel;

    @Column(name = "position_title", nullable = false, length = 200)
    private String positionTitle;

    /** fresher | junior | middle | senior. */
    @Column(name = "level", nullable = false, length = 20)
    private String level;

    /** behavioral | technical | mixed. */
    @Column(name = "interview_type", nullable = false, length = 20)
    private String interviewType;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = IN_PROGRESS;

    @Column(name = "model_id")
    private Long modelId;

    /** CV and target text as they were when the session started; never sent back to the client. */
    @Column(name = "context_text", columnDefinition = "MEDIUMTEXT")
    private String contextText;

    @Column(name = "overall_score")
    private Integer overallScore;

    /** Mean score per criterion as JSON, computed in code from the answered questions. */
    @Column(name = "criteria_json", columnDefinition = "TEXT")
    private String criteriaJson;

    @Column(name = "report_json", columnDefinition = "MEDIUMTEXT")
    private String reportJson;

    @Column(name = "report_log_id")
    private Long reportLogId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isCompleted() {
        return COMPLETED.equals(status);
    }
}
