package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;

/**
 * A required/nice-to-have skill on a {@link JobPosting}. Mapped to the
 * junction table {@code job_posting_skill} from {@code V21__add_job_posting.sql}.
 */
@Entity
@Table(name = "job_posting_skill")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPostingSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_posting_id", nullable = false)
    private Long jobPostingId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired;

    /** Read-only convenience association so callers don't need a second lookup. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", insertable = false, updatable = false)
    private Skill skill;
}
