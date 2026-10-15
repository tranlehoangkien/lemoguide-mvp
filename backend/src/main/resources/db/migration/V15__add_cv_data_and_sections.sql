-- =====================================================================
-- V15__add_cv_data_and_sections.sql
-- Adds cv_data (independent CV content JSON) and active_sections (custom
-- enabled sections list JSON) to cv_profile.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE cv_profile
    ADD COLUMN cv_data JSON NULL AFTER template_id,
    ADD COLUMN active_sections JSON NULL AFTER cv_data;

-- =====================================================================
-- End of V15__add_cv_data_and_sections.sql
-- =====================================================================
