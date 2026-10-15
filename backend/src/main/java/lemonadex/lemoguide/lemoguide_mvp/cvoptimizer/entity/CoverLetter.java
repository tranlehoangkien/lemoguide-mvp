package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.entity;

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

/** A saved, user-editable cover letter. Mapped to {@code cover_letter} from {@code V30__add_cv_optimizer.sql}. */
@Entity
@Table(name = "cover_letter")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoverLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "cv_profile_id")
    private Long cvProfileId;

    @Column(name = "job_posting_id")
    private Long jobPostingId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(nullable = false, length = 20)
    private String tone;

    @Column(nullable = false, length = 5)
    private String language;

    @Column(name = "generation_log_id")
    private Long generationLogId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
