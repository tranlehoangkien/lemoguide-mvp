package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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

/**
 * A job posting for the "Viec lam phu hop" (job matching) feature. Mapped to
 * {@code job_posting} from {@code V21__add_job_posting.sql}. See that
 * migration for the rationale behind {@code source} / {@code companyId}.
 */
@Entity
@Table(name = "job_posting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = JobPostingSourceConverter.class)
    @Column(nullable = false, length = 20)
    private JobPostingSource source;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "posted_by_account_id")
    private Long postedByAccountId;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "company_logo_url", length = 500)
    private String companyLogoUrl;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(length = 150)
    private String location;

    @Convert(converter = EmploymentTypeConverter.class)
    @Column(name = "employment_type", nullable = false, length = 20)
    private EmploymentType employmentType;

    @Convert(converter = ExperienceLevelConverter.class)
    @Column(name = "experience_level", nullable = false, length = 20)
    private ExperienceLevel experienceLevel;

    @Column(name = "salary_min")
    private Integer salaryMin;

    @Column(name = "salary_max")
    private Integer salaryMax;

    @Column(name = "salary_currency", nullable = false, length = 10)
    private String salaryCurrency;

    @Column(name = "is_salary_negotiable", nullable = false)
    private Boolean isSalaryNegotiable;

    @Convert(converter = JobPostingStatusConverter.class)
    @Column(nullable = false, length = 10)
    private JobPostingStatus status;

    @Column(name = "posted_at", nullable = false)
    private LocalDateTime postedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
