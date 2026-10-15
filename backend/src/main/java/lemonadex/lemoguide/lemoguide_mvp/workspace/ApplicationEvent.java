package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "application_event") @Getter @Setter
public class ApplicationEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long applicationId;
    @Column(nullable = false, length = 20) private String status;
    @Column(nullable = false) private LocalDateTime occurredAt;
    @Column(nullable = false, length = 200) private String description;
}
