ALTER TABLE plan
    ADD COLUMN messages_per_day INT NULL,
    ADD COLUMN messages_per_week INT NULL,
    ADD COLUMN messages_per_month INT NULL;

UPDATE plan SET messages_per_week = 200, messages_per_month = 800 WHERE LOWER(name) = 'free';
UPDATE plan SET messages_per_week = 1000, messages_per_month = 4000 WHERE LOWER(name) = 'pro';

-- Separate from deletable conversations / generation logs so deleting history
-- never restores quota. One successful user-facing AI task costs one credit.
CREATE TABLE plan_usage_event (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT UNSIGNED NOT NULL,
    is_message BOOLEAN NOT NULL,
    used_at DATETIME(6) NOT NULL,
    INDEX idx_plan_usage_account_time (account_id, used_at),
    CONSTRAINT fk_plan_usage_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);

INSERT INTO plan_usage_event (account_id, is_message, used_at)
SELECT account_id, action_type IN ('chat', 'chat_cv_coach', 'chat_interview_coach', 'chat_career_coach', 'chat_job_search_coach'), created_at
FROM ai_generation_log WHERE status = 'success';
