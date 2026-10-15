-- =====================================================================
-- V18__set_all_accounts_free_plan.sql
-- Resets account.plan_id back to the "Free" plan for every existing
-- account, regardless of whatever plan they currently carry. One-time
-- data correction requested directly by the team, not tied to any
-- billing event - matches the spirit of V14__unlimited_ai_credits.sql
-- (AI usage/plan limits are informational only right now, nothing
-- enforces them).
-- =====================================================================

SET NAMES utf8mb4;

UPDATE account, (SELECT id FROM plan WHERE name = 'Free' LIMIT 1) AS free_plan
SET account.plan_id = free_plan.id;

-- =====================================================================
-- End of V18__set_all_accounts_free_plan.sql
-- =====================================================================
