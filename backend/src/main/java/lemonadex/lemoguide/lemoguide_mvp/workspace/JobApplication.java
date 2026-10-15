package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.*;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "job_application", uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "job_posting_id"}))
@Getter @Setter
public class JobApplication {
    public enum Status { SAVED, APPLIED, INTERVIEW, OFFER, REJECTED, WITHDRAWN }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long accountId;
    private Long jobPostingId;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, length = 200) private String company;
    @Column(length = 500) private String sourceUrl;
    private Long cvProfileId;
    @Column(length = 200) private String cvName;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status;
    private LocalDate appliedDate;
    private LocalDateTime nextActionAt;
    @Column(length = 200) private String nextAction;
    @Column(length = 4000) private String notes;
    @Column(nullable = false) private LocalDateTime createdAt;
    @Column(nullable = false) private LocalDateTime updatedAt;
    @Version private Long version;
    @PrePersist void created() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = LocalDateTime.now(); }
}
