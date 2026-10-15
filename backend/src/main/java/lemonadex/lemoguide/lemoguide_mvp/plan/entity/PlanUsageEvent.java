package lemonadex.lemoguide.lemoguide_mvp.plan.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plan_usage_event")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PlanUsageEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "account_id", nullable = false)
    private Long accountId;
    @Column(name = "is_message", nullable = false)
    private boolean message;
    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;
}
