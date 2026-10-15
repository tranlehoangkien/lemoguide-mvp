-- =====================================================================
-- V1__create_tables.sql
-- Dynamic CV System - Initial schema
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. account
-- ---------------------------------------------------------------------
CREATE TABLE account (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    status          ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
    last_login_at   DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,
    CONSTRAINT uq_account_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. user_information
-- ---------------------------------------------------------------------
CREATE TABLE user_information (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id          BIGINT UNSIGNED NOT NULL,
    avatar_url          VARCHAR(500)    NULL,
    full_name           VARCHAR(150)    NOT NULL,
    current_title       VARCHAR(150)    NULL,
    date_of_birth       DATE            NULL,
    gender              ENUM('male','female','other') NULL,
    short_term_goal     TEXT            NULL,
    long_term_goal      TEXT            NULL,
    city                VARCHAR(100)    NULL,
    district            VARCHAR(100)    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,
    CONSTRAINT uq_user_information_account UNIQUE (account_id),
    CONSTRAINT fk_user_information_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. contact
-- ---------------------------------------------------------------------
CREATE TABLE contact (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    type                    ENUM('phone','email','linkedin','github','website','other') NOT NULL,
    value                   VARCHAR(255)    NOT NULL,
    is_primary              BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_contact_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. major (lookup)
-- ---------------------------------------------------------------------
CREATE TABLE major (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_major_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. education
-- ---------------------------------------------------------------------
CREATE TABLE education (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    major_id                BIGINT UNSIGNED NULL,
    school_name             VARCHAR(200)    NOT NULL,
    start_date              DATE            NOT NULL,
    end_date                DATE            NULL,
    gpa                     DECIMAL(3,2)    NULL,
    classification          VARCHAR(50)     NULL,
    thesis_achievement      TEXT            NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_education_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    CONSTRAINT fk_education_major
        FOREIGN KEY (major_id) REFERENCES major(id) ON DELETE SET NULL,
    INDEX idx_education_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. experience
-- ---------------------------------------------------------------------
CREATE TABLE experience (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    company_name            VARCHAR(200)    NOT NULL,
    job_title                VARCHAR(150)    NOT NULL,
    start_date               DATE            NOT NULL,
    end_date                 DATE            NULL,
    is_current                BOOLEAN         NOT NULL DEFAULT FALSE,
    description               TEXT            NULL,
    target_tag                ENUM('frontend','backend','fullstack','other') NULL,
    display_order             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_experience_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_experience_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. technology (lookup)
-- ---------------------------------------------------------------------
CREATE TABLE technology (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    category        VARCHAR(50)     NULL,
    icon_url        VARCHAR(500)    NULL,
    description     TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_technology_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. experience_technology (junction)
-- ---------------------------------------------------------------------
CREATE TABLE experience_technology (
    experience_id   BIGINT UNSIGNED NOT NULL,
    technology_id   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (experience_id, technology_id),
    CONSTRAINT fk_exptech_experience
        FOREIGN KEY (experience_id) REFERENCES experience(id) ON DELETE CASCADE,
    CONSTRAINT fk_exptech_technology
        FOREIGN KEY (technology_id) REFERENCES technology(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. skill (lookup)
-- ---------------------------------------------------------------------
CREATE TABLE skill (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    type            ENUM('hard','soft','language') NOT NULL,
    description     TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_skill_name_type UNIQUE (name, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. user_skill (junction)
-- ---------------------------------------------------------------------
CREATE TABLE user_skill (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    skill_id                BIGINT UNSIGNED NOT NULL,
    proficiency_level       TINYINT UNSIGNED NULL,
    language_level          VARCHAR(50)     NULL,
    created_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_skill UNIQUE (user_information_id, skill_id),
    CONSTRAINT fk_userskill_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    CONSTRAINT fk_userskill_skill
        FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_skill_proficiency CHECK (proficiency_level IS NULL OR proficiency_level BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. project
-- ---------------------------------------------------------------------
CREATE TABLE project (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    name                    VARCHAR(200)    NOT NULL,
    role                    VARCHAR(150)    NULL,
    description             TEXT            NULL,
    start_date              DATE            NULL,
    end_date                DATE            NULL,
    demo_url                VARCHAR(500)    NULL,
    github_url              VARCHAR(500)    NULL,
    display_order           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_project_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. project_technology (junction)
-- ---------------------------------------------------------------------
CREATE TABLE project_technology (
    project_id      BIGINT UNSIGNED NOT NULL,
    technology_id   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (project_id, technology_id),
    CONSTRAINT fk_projtech_project
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_projtech_technology
        FOREIGN KEY (technology_id) REFERENCES technology(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. certificate
-- ---------------------------------------------------------------------
CREATE TABLE certificate (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    name                    VARCHAR(200)    NOT NULL,
    issued_by               VARCHAR(200)    NULL,
    issued_year             SMALLINT        NULL,
    credential_url          VARCHAR(500)    NULL,
    description             TEXT            NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificate_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_certificate_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. award
-- ---------------------------------------------------------------------
CREATE TABLE award (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    name                    VARCHAR(200)    NOT NULL,
    granted_by              VARCHAR(200)    NULL,
    granted_year            SMALLINT        NULL,
    description             TEXT            NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_award_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_award_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. interest
-- ---------------------------------------------------------------------
CREATE TABLE interest (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    name                    VARCHAR(150)    NOT NULL,
    description             TEXT            NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interest_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_interest_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 16. referrer
-- ---------------------------------------------------------------------
CREATE TABLE referrer (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    name                    VARCHAR(150)    NOT NULL,
    position                VARCHAR(150)    NULL,
    company                 VARCHAR(200)    NULL,
    contact_info            VARCHAR(255)    NULL,
    visibility               ENUM('private','public') NOT NULL DEFAULT 'private',
    created_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_referrer_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_referrer_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 17. cv_profile  (Engine Hiển thị Động)
-- ---------------------------------------------------------------------
CREATE TABLE cv_profile (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_information_id     BIGINT UNSIGNED NOT NULL,
    name                    VARCHAR(150)    NOT NULL,
    theme_layout            VARCHAR(100)    NOT NULL DEFAULT 'sidebar-blue',
    target_mode             ENUM('frontend','backend','fullstack') NOT NULL,
    publish_mode            ENUM('public_link','pdf','ats_text') NOT NULL DEFAULT 'public_link',
    public_slug             VARCHAR(150)    NULL,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    view_count              INT UNSIGNED    NOT NULL DEFAULT 0,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_cv_profile_slug UNIQUE (public_slug),
    CONSTRAINT fk_cvprofile_user_information
        FOREIGN KEY (user_information_id) REFERENCES user_information(id) ON DELETE CASCADE,
    INDEX idx_cvprofile_user (user_information_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 18. cv_section_visibility
-- ---------------------------------------------------------------------
CREATE TABLE cv_section_visibility (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cv_profile_id       BIGINT UNSIGNED NOT NULL,
    section_name        VARCHAR(50)     NOT NULL,
    is_visible          BOOLEAN         NOT NULL DEFAULT TRUE,
    display_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT uq_cv_section UNIQUE (cv_profile_id, section_name),
    CONSTRAINT fk_cvsection_profile
        FOREIGN KEY (cv_profile_id) REFERENCES cv_profile(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V1__create_tables.sql
-- =====================================================================
