-- H2 equivalents of V50/V53's JDBC-managed tables (not created by Hibernate).
CREATE TABLE IF NOT EXISTS admin_permission (
    account_id BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    permission VARCHAR(40) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, permission)
);
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT REFERENCES account(id) ON DELETE SET NULL,
    actor_email VARCHAR(255), method VARCHAR(10) NOT NULL, path VARCHAR(500) NOT NULL,
    module VARCHAR(40) NOT NULL, target_id BIGINT, status SMALLINT NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0, ip VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS system_setting (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    updated_by BIGINT REFERENCES account(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- These tests provide explicit prompt templates; an empty defaults table allows model creation.
CREATE TABLE IF NOT EXISTS ai_prompt_default (
    action_type VARCHAR(40) PRIMARY KEY,
    prompt_text TEXT NOT NULL
);
INSERT INTO system_setting(setting_key, setting_value)
SELECT 'cv.default_publish_mode', 'PDF' WHERE NOT EXISTS (SELECT 1 FROM system_setting WHERE setting_key = 'cv.default_publish_mode');
INSERT INTO system_setting(setting_key, setting_value)
SELECT 'cv.public_link_enabled', 'true' WHERE NOT EXISTS (SELECT 1 FROM system_setting WHERE setting_key = 'cv.public_link_enabled');
INSERT INTO system_setting(setting_key, setting_value)
SELECT 'cv.default_share_expiry_days', '0' WHERE NOT EXISTS (SELECT 1 FROM system_setting WHERE setting_key = 'cv.default_share_expiry_days');
