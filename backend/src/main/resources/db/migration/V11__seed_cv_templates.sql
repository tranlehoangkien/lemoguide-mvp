-- =====================================================================
-- V11__seed_cv_templates.sql
-- Seeds 5 standard, ready-to-use rows into cv_template (added by
-- V6__add_cv_ai_management.sql) so the admin "Template CV" page and the
-- end-user CV creation flow have real templates to pick from instead of
-- an empty list.
--
-- The platform currently focuses on the IT industry only, so every seed
-- template below is category = 'IT', differentiated by IT role
-- (Frontend / Backend / Fullstack / DevOps & Cloud / Data & AI) instead
-- of by industry.
--
-- layout_config follows the shape validated by CvTemplateService
-- (backend/.../cvtemplate/service/CvTemplateService.java):
--   { "columns": 1|2, "spacing": "compact"|"normal"|"spacious",
--     "sections_order": [ ... ], "header_style": "..." }
--
-- Idempotent: each INSERT is guarded by NOT EXISTS on name, so re-running
-- this migration (or applying it after a template with the same name was
-- already created by hand) never creates duplicates.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Frontend Developer Modern - 2 cot, thien ve skills/projects
-- ---------------------------------------------------------------------
INSERT INTO cv_template (name, category, thumbnail_url, layout_config, is_premium, is_active, created_by)
SELECT 'Frontend Developer Modern', 'IT', NULL,
'{"columns":2,"spacing":"normal","sections_order":["header","skills","projects","experience","education","certificates"],"header_style":"sidebar-photo"}',
FALSE, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Frontend Developer Modern');

-- ---------------------------------------------------------------------
-- 2. Backend Engineer Clean - 1 cot, gon gang, thien ve kinh nghiem
-- ---------------------------------------------------------------------
INSERT INTO cv_template (name, category, thumbnail_url, layout_config, is_premium, is_active, created_by)
SELECT 'Backend Engineer Clean', 'IT', NULL,
'{"columns":1,"spacing":"compact","sections_order":["header","experience","skills","projects","education","certificates"],"header_style":"minimal-classic"}',
FALSE, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Backend Engineer Clean');

-- ---------------------------------------------------------------------
-- 3. Fullstack Developer Sidebar - 2 cot, can bang skills/experience
-- ---------------------------------------------------------------------
INSERT INTO cv_template (name, category, thumbnail_url, layout_config, is_premium, is_active, created_by)
SELECT 'Fullstack Developer Sidebar', 'IT', NULL,
'{"columns":2,"spacing":"normal","sections_order":["header","skills","experience","projects","education","awards"],"header_style":"sidebar-photo"}',
TRUE, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Fullstack Developer Sidebar');

-- ---------------------------------------------------------------------
-- 4. DevOps & Cloud Engineer - 2 cot, nhan manh chung chi/skills
-- ---------------------------------------------------------------------
INSERT INTO cv_template (name, category, thumbnail_url, layout_config, is_premium, is_active, created_by)
SELECT 'DevOps & Cloud Engineer', 'IT', NULL,
'{"columns":2,"spacing":"compact","sections_order":["header","skills","experience","certificates","projects","education"],"header_style":"top-banner"}',
TRUE, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'DevOps & Cloud Engineer');

-- ---------------------------------------------------------------------
-- 5. Data & AI Specialist - 1 cot, thien ve hoc van/nghien cuu
-- ---------------------------------------------------------------------
INSERT INTO cv_template (name, category, thumbnail_url, layout_config, is_premium, is_active, created_by)
SELECT 'Data & AI Specialist', 'IT', NULL,
'{"columns":1,"spacing":"spacious","sections_order":["header","education","skills","projects","experience","certificates"],"header_style":"centered-photo"}',
FALSE, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Data & AI Specialist');

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V11__seed_cv_templates.sql
-- =====================================================================
