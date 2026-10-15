package lemonadex.lemoguide.lemoguide_mvp.careerplan.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "career_task", uniqueConstraints = @UniqueConstraint(columnNames = {"plan_id", "week_number"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CareerTask {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "plan_id", nullable = false)
    private Long planId;
    /** Catalog course this week studies; null for self-study / capstone weeks or a deleted course. */
    @Column(name = "course_id")
    private Long courseId;
    /** Snapshot of the course title, kept if the course is renamed or deleted. */
    @Column(name = "course_title", length = 200)
    private String courseTitle;
    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(name = "action_text", nullable = false, columnDefinition = "TEXT")
    private String action;
    @Column(name = "success_criteria", nullable = false, columnDefinition = "TEXT")
    private String successCriteria;
    @Column(name = "estimated_hours", nullable = false)
    private Integer estimatedHours;
    @Column(name = "checkpoints_json", columnDefinition = "TEXT")
    private String checkpointsJson;
    @Column(name = "resources_json", columnDefinition = "TEXT")
    private String resourcesJson;
    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;
    @Column(columnDefinition = "TEXT")
    private String notes;
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
