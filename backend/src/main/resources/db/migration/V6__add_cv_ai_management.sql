-- =====================================================================
-- V6__add_cv_ai_management.sql
-- Adds everything needed for AI-assisted CV creation/editing and the
-- admin "Quan ly CV" module, on top of the existing schema:
--   * cv_profile        (already exists - the CV itself)
--   * cv_section_visibility (already exists - "Cau hinh hien thi")
--   * account / role    (already exists - auth & admin flag)
--
-- New in this migration:
--   1. cv_template            - admin-managed CV templates
--   2. theme                  - real color/font/layout presets
--      (cv_profile.theme_layout -> replaced by theme_id FK)
--   3. cv_version              - snapshot history / undo for AI edits
--   4. plan                    - Free / Pro / Enterprise
--   5. account.plan_id + account.ai_credits_remaining
--   6. ai_model                - provider + model config
--   7. ai_prompt_template       - system prompts per action, versioned
--   8. ai_generation_log        - every AI call, for usage & debugging
--   9. ai_credit_transaction    - credit ledger (used/purchased/reset)
--  10. job_description          - JD matching feature
--  11. cv_export                - export (pdf/docx) history
--  12. cv_profile share columns - password + expiry for public link
--
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. cv_template
-- ---------------------------------------------------------------------
CREATE TABLE cv_template (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    category        VARCHAR(100)    NULL,              -- e.g. IT, Marketing, Sinh vien
    thumbnail_url   VARCHAR(500)    NULL,
    layout_config   JSON            NULL,               -- column count, spacing defaults...
    is_premium      BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NULL,               -- admin account
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cvtemplate_created_by
        FOREIGN KEY (created_by) REFERENCES account(id) ON DELETE SET NULL,
    INDEX idx_cvtemplate_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. theme
--    Replaces the free-text cv_profile.theme_layout with a managed table
--    so the admin "Theme & Layout" screen has real rows to CRUD.
-- ---------------------------------------------------------------------
CREATE TABLE theme (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    color_scheme    JSON            NOT NULL,           -- {primary, secondary, background,...}
    font_pair       VARCHAR(100)    NOT NULL,
    layout_type     ENUM('single','sidebar') NOT NULL DEFAULT 'single',
    density         ENUM('compact','normal','spacious') NOT NULL DEFAULT 'normal',
    is_default      BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_theme_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default) VALUES
    ('sidebar-blue', JSON_OBJECT('primary', '#2563EB', 'secondary', '#1E3A8A', 'background', '#FFFFFF'),
     'Inter', 'sidebar', 'normal', TRUE);

-- cv_profile: point to a real template/theme row instead of a free string
ALTER TABLE cv_profile
    ADD COLUMN template_id BIGINT UNSIGNED NULL AFTER user_information_id,
    ADD COLUMN theme_id    BIGINT UNSIGNED NULL AFTER theme_layout;

ALTER TABLE cv_profile
    ADD CONSTRAINT fk_cvprofile_template
        FOREIGN KEY (template_id) REFERENCES cv_template(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_cvprofile_theme
        FOREIGN KEY (theme_id) REFERENCES theme(id) ON DELETE SET NULL,
    ADD INDEX idx_cvprofile_template (template_id),
    ADD INDEX idx_cvprofile_theme (theme_id);

-- Backfill existing rows to the seeded default theme, keep theme_layout
-- column for now (deprecated) to avoid breaking in-flight reads.
UPDATE cv_profile SET theme_id = (SELECT id FROM theme WHERE name = 'sidebar-blue' LIMIT 1)
WHERE theme_id IS NULL;

-- ---------------------------------------------------------------------
-- 3. cv_version
--    Snapshot on every save so AI edits can be undone / compared.
-- ---------------------------------------------------------------------
CREATE TABLE cv_version (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cv_profile_id   BIGINT UNSIGNED NOT NULL,
    snapshot        JSON            NOT NULL,           -- full CV content at this point
    created_by      ENUM('user','ai') NOT NULL DEFAULT 'user',
    ai_generation_log_id BIGINT UNSIGNED NULL,           -- set when created_by = 'ai'
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cvversion_profile
        FOREIGN KEY (cv_profile_id) REFERENCES cv_profile(id) ON DELETE CASCADE,
    INDEX idx_cvversion_profile (cv_profile_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. plan
-- ---------------------------------------------------------------------
CREATE TABLE plan (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(50)     NOT NULL,   -- Free / Pro / Enterprise
    price                   DECIMAL(10,2)   NOT NULL DEFAULT 0,
    billing_cycle           ENUM('monthly','yearly','one_time') NOT NULL DEFAULT 'monthly',
    ai_credits_per_month    INT UNSIGNED    NOT NULL DEFAULT 0,
    max_cvs                 INT UNSIGNED    NULL,        -- NULL = unlimited
    allow_premium_templates BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_plan_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO plan (name, price, billing_cycle, ai_credits_per_month, max_cvs, allow_premium_templates) VALUES
    ('Free', 0.00,  'monthly', 10,  3,    FALSE),
    ('Pro',  99000, 'monthly', 200, NULL, TRUE);

-- ---------------------------------------------------------------------
-- 5. account: plan + credit balance
-- ---------------------------------------------------------------------
ALTER TABLE account
    ADD COLUMN plan_id             BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER role_id,
    ADD COLUMN ai_credits_remaining INT UNSIGNED   NOT NULL DEFAULT 10 AFTER plan_id;

ALTER TABLE account
    ADD CONSTRAINT fk_account_plan FOREIGN KEY (plan_id) REFERENCES plan(id),
    ADD INDEX idx_account_plan (plan_id);

-- ---------------------------------------------------------------------
-- 6. ai_model
-- ---------------------------------------------------------------------
CREATE TABLE ai_model (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider                ENUM('openai','anthropic','google','other') NOT NULL,
    model_name              VARCHAR(100)    NOT NULL,   -- e.g. claude-sonnet-4-6
    api_key_encrypted       VARCHAR(500)    NOT NULL,
    max_tokens_per_request  INT UNSIGNED    NOT NULL DEFAULT 4096,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_ai_model_provider_name UNIQUE (provider, model_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. ai_prompt_template
-- ---------------------------------------------------------------------
CREATE TABLE ai_prompt_template (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action_type     ENUM('generate','optimize','match_jd','translate','grammar_check') NOT NULL,
    model_id        BIGINT UNSIGNED NOT NULL,
    prompt_text     TEXT            NOT NULL,
    version         INT UNSIGNED    NOT NULL DEFAULT 1,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NULL,               -- admin account
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prompt_model
        FOREIGN KEY (model_id) REFERENCES ai_model(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prompt_created_by
        FOREIGN KEY (created_by) REFERENCES account(id) ON DELETE SET NULL,
    INDEX idx_prompt_action_active (action_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. ai_generation_log
-- ---------------------------------------------------------------------
CREATE TABLE ai_generation_log (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id          BIGINT UNSIGNED NOT NULL,
    cv_profile_id       BIGINT UNSIGNED NULL,
    prompt_template_id  BIGINT UNSIGNED NOT NULL,
    action_type         ENUM('generate','optimize','match_jd','translate','grammar_check') NOT NULL,
    input_summary       TEXT            NULL,
    output_summary      TEXT            NULL,
    input_tokens        INT UNSIGNED    NOT NULL DEFAULT 0,
    output_tokens       INT UNSIGNED    NOT NULL DEFAULT 0,
    cost                DECIMAL(10,4)   NOT NULL DEFAULT 0,
    status              ENUM('success','failed','timeout') NOT NULL,
    error_message       VARCHAR(500)    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_genlog_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_genlog_cvprofile
        FOREIGN KEY (cv_profile_id) REFERENCES cv_profile(id) ON DELETE SET NULL,
    CONSTRAINT fk_genlog_prompt
        FOREIGN KEY (prompt_template_id) REFERENCES ai_prompt_template(id) ON DELETE RESTRICT,
    INDEX idx_genlog_account_date (account_id, created_at),
    INDEX idx_genlog_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cv_version -> ai_generation_log (added after the log table exists)
ALTER TABLE cv_version
    ADD CONSTRAINT fk_cvversion_genlog
        FOREIGN KEY (ai_generation_log_id) REFERENCES ai_generation_log(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 9. ai_credit_transaction
-- ---------------------------------------------------------------------
CREATE TABLE ai_credit_transaction (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id              BIGINT UNSIGNED NOT NULL,
    amount                  INT             NOT NULL,   -- negative = used, positive = added
    reason                  ENUM('used','purchased','monthly_reset','refund') NOT NULL,
    related_generation_log_id BIGINT UNSIGNED NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credittx_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_credittx_genlog
        FOREIGN KEY (related_generation_log_id) REFERENCES ai_generation_log(id) ON DELETE SET NULL,
    INDEX idx_credittx_account_date (account_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. job_description  (CV <-> JD matching)
-- ---------------------------------------------------------------------
CREATE TABLE job_description (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id          BIGINT UNSIGNED NOT NULL,
    cv_profile_id       BIGINT UNSIGNED NULL,
    raw_text            TEXT            NOT NULL,
    extracted_keywords  JSON            NULL,
    match_score         TINYINT UNSIGNED NULL,          -- 0-100
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jd_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_jd_cvprofile
        FOREIGN KEY (cv_profile_id) REFERENCES cv_profile(id) ON DELETE SET NULL,
    CONSTRAINT chk_jd_match_score CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 100),
    INDEX idx_jd_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. cv_export
-- ---------------------------------------------------------------------
CREATE TABLE cv_export (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cv_profile_id   BIGINT UNSIGNED NOT NULL,
    account_id      BIGINT UNSIGNED NOT NULL,
    format          ENUM('pdf','docx','png') NOT NULL,
    file_url        VARCHAR(500)    NULL,
    status          ENUM('processing','success','failed') NOT NULL DEFAULT 'processing',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_export_cvprofile
        FOREIGN KEY (cv_profile_id) REFERENCES cv_profile(id) ON DELETE CASCADE,
    CONSTRAINT fk_export_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    INDEX idx_export_cvprofile (cv_profile_id),
    INDEX idx_export_account_date (account_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. cv_profile: extra columns for public-share protection
--     (public_slug / view_count already exist from V1)
-- ---------------------------------------------------------------------
ALTER TABLE cv_profile
    ADD COLUMN share_password_hash VARCHAR(255) NULL AFTER public_slug,
    ADD COLUMN share_expires_at    DATETIME     NULL AFTER share_password_hash;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V6__add_cv_ai_management.sql
-- =====================================================================
