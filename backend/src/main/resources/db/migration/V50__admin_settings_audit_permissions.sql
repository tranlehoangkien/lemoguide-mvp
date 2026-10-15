-- =====================================================================
-- V50__admin_settings_audit_permissions.sql
-- Admin console "Cài đặt hệ thống":
--   * system_setting        key/value settings edited from the admin UI (CV publish_mode defaults)
--   * admin_activity_log    one row per write request (POST/PUT/PATCH/DELETE) to /api/admin/**
--   * admin_permission      which admin modules each ADMIN account may use; every existing admin
--                           starts with every module so nobody loses access by this migration
-- =====================================================================

SET NAMES utf8mb4;

CREATE TABLE system_setting (
    setting_key   VARCHAR(100)    NOT NULL PRIMARY KEY,
    setting_value VARCHAR(500)    NOT NULL,
    updated_by    BIGINT UNSIGNED NULL,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_system_setting_account FOREIGN KEY (updated_by) REFERENCES account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Defaults keep today's behaviour: new CVs start as a PDF draft, public links are allowed and never expire.
INSERT INTO system_setting (setting_key, setting_value) VALUES
    ('cv.default_publish_mode', 'PDF'),
    ('cv.public_link_enabled', 'true'),
    ('cv.default_share_expiry_days', '0');

CREATE TABLE admin_activity_log (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_id    BIGINT UNSIGNED NULL,
    actor_email VARCHAR(255)    NULL,
    method      VARCHAR(10)     NOT NULL,
    path        VARCHAR(500)    NOT NULL,
    module      VARCHAR(40)     NOT NULL,
    target_id   BIGINT UNSIGNED NULL,
    status      SMALLINT        NOT NULL,
    duration_ms INT             NOT NULL DEFAULT 0,
    ip          VARCHAR(64)     NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_activity_actor FOREIGN KEY (actor_id) REFERENCES account(id) ON DELETE SET NULL,
    INDEX idx_admin_activity_created (created_at),
    INDEX idx_admin_activity_module (module, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_permission (
    account_id BIGINT UNSIGNED NOT NULL,
    permission VARCHAR(40)     NOT NULL,
    granted_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, permission),
    CONSTRAINT fk_admin_permission_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_permission (account_id, permission)
SELECT a.id, p.permission
FROM account a
JOIN role r ON r.id = a.role_id AND r.name = 'ADMIN'
CROSS JOIN (
    SELECT 'USERS' AS permission UNION ALL SELECT 'CV' UNION ALL SELECT 'MASTER_DATA' UNION ALL SELECT 'AI'
    UNION ALL SELECT 'CAREER' UNION ALL SELECT 'NETWORK' UNION ALL SELECT 'REPORTS' UNION ALL SELECT 'SYSTEM'
) p;
