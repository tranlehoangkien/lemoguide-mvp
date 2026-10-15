CREATE TABLE weekly_task (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    notes VARCHAR(4000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at DATETIME,
    created_at DATETIME NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_weekly_task_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    INDEX idx_weekly_task_due (account_id, due_date),
    INDEX idx_weekly_task_completed (account_id, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_application (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL,
    job_posting_id BIGINT UNSIGNED,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    source_url VARCHAR(500),
    cv_profile_id BIGINT UNSIGNED,
    cv_name VARCHAR(200),
    status VARCHAR(20) NOT NULL,
    applied_date DATE,
    next_action_at DATETIME,
    next_action VARCHAR(200),
    notes VARCHAR(4000),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_application_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_application_job FOREIGN KEY (job_posting_id) REFERENCES job_posting(id) ON DELETE SET NULL,
    CONSTRAINT fk_application_cv FOREIGN KEY (cv_profile_id) REFERENCES cv_profile(id) ON DELETE SET NULL,
    UNIQUE KEY uq_application_job (account_id, job_posting_id),
    INDEX idx_application_status (account_id, status, updated_at),
    INDEX idx_application_next (account_id, next_action_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_event (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL,
    occurred_at DATETIME NOT NULL,
    description VARCHAR(200) NOT NULL,
    CONSTRAINT fk_application_event FOREIGN KEY (application_id) REFERENCES job_application(id) ON DELETE CASCADE,
    INDEX idx_application_event (application_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
