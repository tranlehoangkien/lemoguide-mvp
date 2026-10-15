package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

/**
 * Mirrors the {@code job_posting.status} MySQL ENUM('active','closed','draft')
 * via {@link JobPostingStatusConverter}.
 */
public enum JobPostingStatus {
    ACTIVE,
    CLOSED,
    DRAFT
}
