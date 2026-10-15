package lemonadex.lemoguide.lemoguide_mvp.discovery;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "discovery_attempt")
@Getter @Setter @NoArgsConstructor
public class DiscoveryAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long accountId;
    @Column(nullable = false, length = 20) private String kind;
    @Column(nullable = false, length = 30) private String bankVersion;
    @Column(nullable = false, columnDefinition = "TEXT") private String answersJson = "{}";
    @Column(columnDefinition = "TEXT") private String resultJson;
    /** Conversation state of the adaptive AI test ({@code holland-ai}); null for the fixed assessments. */
    @Column(columnDefinition = "MEDIUMTEXT") private String stateJson;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime completedAt;
    @Version private Long version;
}
