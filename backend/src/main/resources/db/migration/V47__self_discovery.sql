CREATE TABLE discovery_attempt (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL,
    kind VARCHAR(20) NOT NULL,
    bank_version VARCHAR(30) NOT NULL,
    answers_json TEXT NOT NULL,
    result_json TEXT NULL,
    created_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_discovery_account_kind (account_id, kind, id),
    CONSTRAINT fk_discovery_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);
