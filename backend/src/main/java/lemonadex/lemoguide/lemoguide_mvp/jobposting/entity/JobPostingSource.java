package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

/**
 * Mirrors the {@code job_posting.source} MySQL ENUM('seed_fake','crawled',
 * 'company_posted') via {@link JobPostingSourceConverter}. See
 * {@code V21__add_job_posting.sql} for the rationale.
 */
public enum JobPostingSource {
    SEED_FAKE,
    CRAWLED,
    COMPANY_POSTED
}
