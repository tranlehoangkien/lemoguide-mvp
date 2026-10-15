package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "weekly_task") @Getter @Setter
public class WeeklyTask {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long accountId;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false) private LocalDate dueDate;
    @Column(length = 4000) private String notes;
    @Column(nullable = false) private boolean completed;
    private LocalDateTime completedAt;
    @Column(nullable = false) private LocalDateTime createdAt;
    @Version private Long version;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
}
