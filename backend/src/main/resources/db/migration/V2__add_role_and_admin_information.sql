-- =====================================================================
-- V2__add_role_and_admin_information.sql
-- Role-based access:
--   * new `role` lookup table (seeded with ADMIN / USER)
--   * `account.role_id` foreign key
--   * new `admin_information` profile table (mirrors user_information)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. role
-- ---------------------------------------------------------------------
CREATE TABLE role (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL,
    description     VARCHAR(255)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO role (id, name, description) VALUES
    (1, 'ADMIN', 'System administrator with full management access'),
    (2, 'USER',  'Standard end user building CV profiles');

-- ---------------------------------------------------------------------
-- 2. account.role_id
--    Added with DEFAULT 2 (USER) so any existing row stays valid, then
--    the default is dropped: new accounts must set their role explicitly.
-- ---------------------------------------------------------------------
ALTER TABLE account
    ADD COLUMN role_id BIGINT UNSIGNED NOT NULL DEFAULT 2 AFTER password_hash;

ALTER TABLE account
    ADD CONSTRAINT fk_account_role FOREIGN KEY (role_id) REFERENCES role(id),
    ADD INDEX idx_account_role (role_id);

ALTER TABLE account
    ALTER COLUMN role_id DROP DEFAULT;

-- ---------------------------------------------------------------------
-- 3. admin_information  (same shape as user_information, minus the
--    CV-only career-goal columns)
-- ---------------------------------------------------------------------
CREATE TABLE admin_information (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id      BIGINT UNSIGNED NOT NULL,
    avatar_url      VARCHAR(500)    NULL,
    full_name       VARCHAR(150)    NOT NULL,
    current_title   VARCHAR(150)    NULL,
    date_of_birth   DATE            NULL,
    gender          ENUM('male','female','other') NULL,
    city            VARCHAR(100)    NULL,
    district        VARCHAR(100)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,
    CONSTRAINT uq_admin_information_account UNIQUE (account_id),
    CONSTRAINT fk_admin_information_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- End of V2__add_role_and_admin_information.sql
-- =====================================================================
