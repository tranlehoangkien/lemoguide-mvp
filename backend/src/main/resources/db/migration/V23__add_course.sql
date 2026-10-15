-- =====================================================================
-- V23__add_course.sql
-- Admin-curated course catalog for the future "Khoa hoc de xuat" (course
-- recommendation) feature under Su nghiep. Unlike job_posting (seeded fake
-- data simulating future company postings), courses are expected to be
-- entered directly by admins from day one, so no seed data is included
-- here - only schema.
--
-- course_skill / course_technology tag which skills/technologies a course
-- teaches, mirroring the job_posting_skill / job_posting_technology shape
-- from V21__add_job_posting.sql so a future roadmap engine can match a
-- user's skill gaps (vs a target job) to courses that cover them.
--
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. course
-- ---------------------------------------------------------------------
CREATE TABLE course (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    provider        VARCHAR(150)    NULL,               -- e.g. Udemy, Coursera, noi bo
    description     TEXT            NULL,
    url             VARCHAR(500)    NULL,
    thumbnail_url   VARCHAR(500)    NULL,
    level           ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
    duration_hours  INT UNSIGNED    NULL,
    price           DECIMAL(10,2)   NULL,
    is_free         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NULL,                -- admin account
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_created_by
        FOREIGN KEY (created_by) REFERENCES account(id) ON DELETE SET NULL,
    INDEX idx_course_active_level (is_active, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. course_skill
-- ---------------------------------------------------------------------
CREATE TABLE course_skill (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id   BIGINT UNSIGNED NOT NULL,
    skill_id    BIGINT UNSIGNED NOT NULL,
    CONSTRAINT uq_courseskill UNIQUE (course_id, skill_id),
    CONSTRAINT fk_courseskill_course
        FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    CONSTRAINT fk_courseskill_skill
        FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. course_technology
-- ---------------------------------------------------------------------
CREATE TABLE course_technology (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id       BIGINT UNSIGNED NOT NULL,
    technology_id   BIGINT UNSIGNED NOT NULL,
    CONSTRAINT uq_coursetech UNIQUE (course_id, technology_id),
    CONSTRAINT fk_coursetech_course
        FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    CONSTRAINT fk_coursetech_technology
        FOREIGN KEY (technology_id) REFERENCES technology(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V23__add_course.sql
-- =====================================================================
