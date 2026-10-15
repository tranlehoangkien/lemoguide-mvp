-- =====================================================================
-- V12__seed_themes.sql
-- Seeds additional rows into `theme` (table created by
-- V6__add_cv_ai_management.sql, which already seeds one default row:
-- 'sidebar-blue') so the admin "Theme & Layout" page and the end-user
-- CV builder have a real palette of presets to pick from instead of a
-- single entry.
--
-- color_scheme follows the shape validated by ThemeService
-- (backend/.../theme/service/ThemeService.java):
--   { "primary": "#RRGGBB", "secondary": "#RRGGBB",
--     "accent": "#RRGGBB" (optional), "text": "#RRGGBB" (optional) }
--
-- Idempotent: each INSERT is guarded by NOT EXISTS on name, so
-- re-running this migration (or applying it after a theme with the
-- same name was already created by hand) never creates duplicates.
-- 'is_default' stays FALSE for every row here — 'sidebar-blue' from V6
-- remains the only default theme.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. classic-navy - 1 cot, chuyen nghiep, phu hop CV truyen thong
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'classic-navy',
JSON_OBJECT('primary', '#1E3A8A', 'secondary', '#334155', 'accent', '#2563EB', 'text', '#0F172A'),
'Inter', 'single', 'normal', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'classic-navy');

-- ---------------------------------------------------------------------
-- 2. minimal-mono - 1 cot, gon gang, toi gian mau den trang
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'minimal-mono',
JSON_OBJECT('primary', '#111827', 'secondary', '#4B5563', 'accent', '#111827', 'text', '#1F2937'),
'Roboto', 'single', 'compact', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'minimal-mono');

-- ---------------------------------------------------------------------
-- 3. sidebar-green - 2 cot, tuoi moi, phu hop nganh cong nghe/moi truong
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'sidebar-green',
JSON_OBJECT('primary', '#15803D', 'secondary', '#166534', 'accent', '#22C55E', 'text', '#052E16'),
'Inter', 'sidebar', 'normal', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'sidebar-green');

-- ---------------------------------------------------------------------
-- 4. creative-purple - 2 cot, thoang, phu hop nganh thiet ke/sang tao
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'creative-purple',
JSON_OBJECT('primary', '#7C3AED', 'secondary', '#5B21B6', 'accent', '#A78BFA', 'text', '#2E1065'),
'Poppins', 'sidebar', 'spacious', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'creative-purple');

-- ---------------------------------------------------------------------
-- 5. warm-orange - 1 cot, thoang, nang dong, phu hop sale/marketing
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'warm-orange',
JSON_OBJECT('primary', '#EA580C', 'secondary', '#C2410C', 'accent', '#FB923C', 'text', '#431407'),
'Lato', 'single', 'spacious', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'warm-orange');

-- ---------------------------------------------------------------------
-- 6. dark-slate - 1 cot, gon gang, tuong phan cao, de doc tren man hinh
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'dark-slate',
JSON_OBJECT('primary', '#0F172A', 'secondary', '#334155', 'accent', '#38BDF8', 'text', '#0F172A'),
'Roboto', 'single', 'compact', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'dark-slate');

-- ---------------------------------------------------------------------
-- 7. rose-elegant - 2 cot, thanh lich, phu hop CV ca nhan/HR
-- ---------------------------------------------------------------------
INSERT INTO theme (name, color_scheme, font_pair, layout_type, density, is_default, is_active)
SELECT 'rose-elegant',
JSON_OBJECT('primary', '#E11D48', 'secondary', '#9F1239', 'accent', '#FB7185', 'text', '#4C0519'),
'Poppins', 'sidebar', 'normal', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM theme WHERE name = 'rose-elegant');

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V12__seed_themes.sql
-- =====================================================================
