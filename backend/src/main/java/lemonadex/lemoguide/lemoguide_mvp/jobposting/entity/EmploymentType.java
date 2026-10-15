package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

/**
 * Mirrors the {@code job_posting.employment_type} MySQL ENUM('full_time',
 * 'part_time','internship','contract','remote') via {@link EmploymentTypeConverter}.
 */
public enum EmploymentType {
    FULL_TIME,
    PART_TIME,
    INTERNSHIP,
    CONTRACT,
    REMOTE
}
