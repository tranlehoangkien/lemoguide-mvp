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
 * One question of an {@link InterviewSession} with the user's answer and the AI feedback, mapped to
 * {@code interview_question}. {@code evaluationJson} is a normalized {@code InterviewEvaluation}.
 */
@Entity
@org.hibernate.annotations.DynamicUpdate
@Table(name = "interview_question")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    public static final String PENDING = "pending";
    public static final String ANSWERED = "answered";
    public static final String SKIPPED = "skipped";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    /** 1-based position inside the session. */
    @Column(name = "seq", nullable = false)
    private Integer seq;

    /** intro | motivation | behavioral | technical | situational. */
    @Column(name = "category", nullable = false, length = 20)
    private String category;

    @Column(name = "question", nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "intent", length = 500)
    private String intent;

    @Column(name = "hint", columnDefinition = "TEXT")
    private String hint;

    @Column(name = "suggested_answer", columnDefinition = "TEXT")
    private String suggestedAnswer;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = PENDING;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    /** typed | voice. */
    @Column(name = "answer_source", length = 10)
    private String answerSource;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "filler_count")
    private Integer fillerCount;

    @Column(name = "score")
    private Integer score;

    @Column(name = "evaluation_json", columnDefinition = "MEDIUMTEXT")
    private String evaluationJson;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    /** Score of the attempt that this one replaced, so the UI can show the improvement. */
    @Column(name = "previous_score")
    private Integer previousScore;

    @Column(name = "generation_log_id")
    private Long generationLogId;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

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

    public boolean isAnswered() {
        return ANSWERED.equals(status);
    }
}
