-- =====================================================================
-- V21__add_job_posting.sql
-- Schema for the "Viec lam phu hop" (Job Matching) feature under Su
-- nghiep. Job postings are sourced from three places, tracked via
-- `source`:
--   * seed_fake      - demo/test data inserted by V22 (this rollout)
--   * crawled        - reserved for a future ingestion job
--   * company_posted - reserved for when a LemoNetwork company/HR
--                       account can post directly (posted_by_account_id)
--
-- `company_id` is left as a plain nullable BIGINT UNSIGNED (no FK yet)
-- because the LemoNetwork `company` table does not exist yet. Once it
-- does, a follow-up migration adds the FK and backfills it; existing
-- rows keep working off `company_name` in the meantime.
--
-- Required skills/technologies are modeled as junctions against the
-- existing `skill` / `technology` lookup tables (see
-- V4__seed_major_skill_technology.sql) instead of free-text, so the
-- matching engine can do a cheap structured overlap against
-- `user_skill` / `experience_technology` before spending AI credits.
--
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. job_posting
-- ---------------------------------------------------------------------
CREATE TABLE job_posting (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    source                  ENUM('seed_fake','crawled','company_posted') NOT NULL DEFAULT 'seed_fake',
    source_url              VARCHAR(500)    NULL,               -- set when source = 'crawled'
    company_id              BIGINT UNSIGNED NULL,                -- future FK -> company(id), no constraint yet
    posted_by_account_id    BIGINT UNSIGNED NULL,                -- set when source = 'company_posted'
    company_name            VARCHAR(200)    NOT NULL,
    company_logo_url        VARCHAR(500)    NULL,
    title                   VARCHAR(200)    NOT NULL,
    description             TEXT            NOT NULL,
    requirements            TEXT            NULL,
    benefits                TEXT            NULL,
    location                VARCHAR(150)    NULL,
    employment_type         ENUM('full_time','part_time','internship','contract','remote') NOT NULL DEFAULT 'full_time',
    experience_level        ENUM('intern','fresher','junior','mid','senior','lead','manager') NOT NULL DEFAULT 'junior',
    salary_min              INT UNSIGNED    NULL,               -- VND
    salary_max              INT UNSIGNED    NULL,               -- VND
    salary_currency         VARCHAR(10)     NOT NULL DEFAULT 'VND',
    is_salary_negotiable    BOOLEAN         NOT NULL DEFAULT FALSE,
    status                  ENUM('active','closed','draft') NOT NULL DEFAULT 'active',
    posted_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at               DATETIME       NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobposting_account
        FOREIGN KEY (posted_by_account_id) REFERENCES account(id) ON DELETE SET NULL,
    CONSTRAINT chk_jobposting_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    INDEX idx_jobposting_status_posted (status, posted_at),
    INDEX idx_jobposting_location (location),
    INDEX idx_jobposting_employment_type (employment_type),
    INDEX idx_jobposting_experience_level (experience_level),
    INDEX idx_jobposting_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. job_posting_skill
-- ---------------------------------------------------------------------
CREATE TABLE job_posting_skill (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_posting_id  BIGINT UNSIGNED NOT NULL,
    skill_id        BIGINT UNSIGNED NOT NULL,
    is_required     BOOLEAN         NOT NULL DEFAULT TRUE,      -- FALSE = "nice to have"
    CONSTRAINT uq_jobpostingskill UNIQUE (job_posting_id, skill_id),
    CONSTRAINT fk_jpskill_jobposting
        FOREIGN KEY (job_posting_id) REFERENCES job_posting(id) ON DELETE CASCADE,
    CONSTRAINT fk_jpskill_skill
        FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. job_posting_technology
-- ---------------------------------------------------------------------
CREATE TABLE job_posting_technology (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_posting_id  BIGINT UNSIGNED NOT NULL,
    technology_id   BIGINT UNSIGNED NOT NULL,
    is_required     BOOLEAN         NOT NULL DEFAULT TRUE,      -- FALSE = "nice to have"
    CONSTRAINT uq_jobpostingtech UNIQUE (job_posting_id, technology_id),
    CONSTRAINT fk_jptech_jobposting
        FOREIGN KEY (job_posting_id) REFERENCES job_posting(id) ON DELETE CASCADE,
    CONSTRAINT fk_jptech_technology
        FOREIGN KEY (technology_id) REFERENCES technology(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V21__add_job_posting.sql
-- =====================================================================
