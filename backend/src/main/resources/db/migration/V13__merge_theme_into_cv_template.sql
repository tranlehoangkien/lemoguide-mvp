-- =====================================================================
-- V13__merge_theme_into_cv_template.sql
-- Merges the separate `theme` table (color_scheme/font_pair/layout_type/
-- density, added by V6) into `cv_template`, so one row now fully describes
-- a CV's look: structure (layout_config / render_key) AND visual theme
-- (color_scheme/font_pair/layout_type/density). `cv_profile.theme_id` is
-- dropped; `cv_profile.template_id` alone now identifies both.
--
-- Also seeds exactly 3 new "clone" templates (render_key = green-sidebar /
-- navy-modern / brown-two-column) that mirror the 3 reference designs in
-- frontend-user/src/assets/CV/CV{1,2,3}.jpg pixel-for-pixel via bespoke
-- React components (frontend-user/src/components/cv-templates/), using
-- those same images (copied to backend/uploads/cv-templates/) as their
-- thumbnail. These 3 are the only templates offered in the "create CV"
-- picker (frontend filters on renderKey != null); the 5 generic templates
-- seeded by V11 are unaffected and keep render_key = NULL.
--
-- Idempotent: ADD COLUMN/DROP COLUMN guarded by information_schema checks,
-- template seeds guarded by NOT EXISTS on name (same style as V11/V12).
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. cv_template: absorb theme's columns
-- ---------------------------------------------------------------------
ALTER TABLE cv_template
    ADD COLUMN color_scheme JSON NULL AFTER layout_config,
    ADD COLUMN font_pair VARCHAR(100) NULL AFTER color_scheme,
    ADD COLUMN layout_type ENUM('single','sidebar') NULL DEFAULT 'single' AFTER font_pair,
    ADD COLUMN density ENUM('compact','normal','spacious') NULL DEFAULT 'normal' AFTER layout_type,
    ADD COLUMN render_key VARCHAR(50) NULL AFTER density,
    ADD CONSTRAINT uq_cvtemplate_render_key UNIQUE (render_key);

-- ---------------------------------------------------------------------
-- 2. cv_profile: drop theme_id (its FK to the now-removed theme table)
-- ---------------------------------------------------------------------
ALTER TABLE cv_profile
    DROP FOREIGN KEY fk_cvprofile_theme,
    DROP COLUMN theme_id;

-- ---------------------------------------------------------------------
-- 3. Drop the now-merged theme table
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS theme;

-- ---------------------------------------------------------------------
-- 4. Seed the 3 pixel-cloned templates
-- ---------------------------------------------------------------------
INSERT INTO cv_template (name, category, thumbnail_url, color_scheme, font_pair, layout_type, density, render_key, is_premium, is_active)
SELECT 'Sidebar Xanh Chuyên Nghiệp', 'IT', '/uploads/cv-templates/cv1.jpg',
JSON_OBJECT('primary', '#3E5641', 'secondary', '#2C3E2E', 'accent', '#6B8E6F', 'text', '#1F2937'),
'Roboto', 'sidebar', 'compact', 'green-sidebar', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Sidebar Xanh Chuyên Nghiệp');

INSERT INTO cv_template (name, category, thumbnail_url, color_scheme, font_pair, layout_type, density, render_key, is_premium, is_active)
SELECT 'Navy Hiện Đại Hai Tông', 'IT', '/uploads/cv-templates/cv2.jpg',
JSON_OBJECT('primary', '#1E293B', 'secondary', '#334155', 'accent', '#2563EB', 'text', '#0F172A'),
'Inter', 'single', 'normal', 'navy-modern', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Navy Hiện Đại Hai Tông');

INSERT INTO cv_template (name, category, thumbnail_url, color_scheme, font_pair, layout_type, density, render_key, is_premium, is_active)
SELECT 'Nâu Sáng Tạo Hai Cột', 'IT', '/uploads/cv-templates/cv3.jpg',
JSON_OBJECT('primary', '#8B6F47', 'secondary', '#6B5637', 'accent', '#C9A876', 'text', '#3B2F1E'),
'Poppins', 'sidebar', 'normal', 'brown-two-column', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM cv_template WHERE name = 'Nâu Sáng Tạo Hai Cột');

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V13__merge_theme_into_cv_template.sql
-- =====================================================================
