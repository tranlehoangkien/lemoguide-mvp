package lemonadex.lemoguide.lemoguide_mvp.jobposting.entity;

/**
 * Mirrors the {@code job_posting.experience_level} MySQL ENUM('intern','fresher',
 * 'junior','mid','senior','lead','manager') via {@link ExperienceLevelConverter}.
 */
public enum ExperienceLevel {
    INTERN,
    FRESHER,
    JUNIOR,
    MID,
    SENIOR,
    LEAD,
    MANAGER
}
