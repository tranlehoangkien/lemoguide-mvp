package lemonadex.lemoguide.lemoguide_mvp.careerplan.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "career_plan")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CareerPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "account_id", nullable = false)
    private Long accountId;
    @Column(name = "cv_profile_id")
    private Long cvProfileId;
    @Column(name = "model_id")
    private Long modelId;
    @Column(name = "generation_log_id")
    private Long generationLogId;
    @Column(nullable = false, length = 20)
    private String intent;
    @Column(name = "target_role", nullable = false, length = 200)
    private String targetRole;
    @Column(name = "hours_per_week", nullable = false)
    private Integer hoursPerWeek;
    @Column(name = "duration_weeks", nullable = false)
    private Integer durationWeeks;
    @Column(name = "use_profile", nullable = false)
    private Boolean useProfile;
    @Column(columnDefinition = "TEXT")
    private String background;
    @Column(name = "constraints_text", columnDefinition = "TEXT")
    private String constraints;
    @Column(name = "context_text", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String contextText;
    @Column(name = "analysis_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String analysisJson;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
