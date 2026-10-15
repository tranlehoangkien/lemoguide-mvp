-- =====================================================================
-- V17__seed_ai_plans.sql
-- Completes the Gói & Giới hạn (Credits/Plans) catalog under "Quan ly AI".
-- The `plan` table and its full admin CRUD backend (PlanController/
-- PlanService/...) already existed since V6__add_cv_ai_management.sql,
-- but that migration only seeded 2 of the 3 tiers its own header comment
-- promised ("Free / Pro / Enterprise") and no admin page ever existed to
-- manage them - this migration adds the missing Enterprise tier so the
-- new admin "Gói & Giới hạn" page (frontend-admin) has a complete catalog
-- to display out of the box.
--
-- ai_credits_per_month / max_cvs use a very high ceiling (not literal
-- NULL/"unlimited") for Enterprise, mirroring this codebase's existing
-- Account.UNLIMITED_AI_CREDITS = 999_999_999 sentinel convention.
-- =====================================================================

SET NAMES utf8mb4;

INSERT INTO plan (name, price, billing_cycle, ai_credits_per_month, max_cvs, allow_premium_templates, is_active)
SELECT 'Enterprise', 299000.00, 'monthly', 999999999, 999999, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE name = 'Enterprise');

-- =====================================================================
-- End of V17__seed_ai_plans.sql
-- =====================================================================
