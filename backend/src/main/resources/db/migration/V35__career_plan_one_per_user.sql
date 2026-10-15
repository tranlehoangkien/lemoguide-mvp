-- Enforce one development roadmap (career_plan) per user.
SET NAMES utf8mb4;

-- Keep only the most recently updated career_plan per account; drop older ones (career_task rows
-- cascade via fk_career_task_plan, ai_conversation.career_plan_id is detached via fk_conversation_career).
DELETE cp FROM career_plan cp
JOIN (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY updated_at DESC, id DESC) AS rn
    FROM career_plan
) ranked ON ranked.id = cp.id
WHERE ranked.rn > 1;

ALTER TABLE career_plan ADD CONSTRAINT uq_career_plan_account UNIQUE (account_id);
