-- =====================================================================
-- V16__add_cv_avatar_url.sql
-- Adds avatar_url (independent CV avatar URL) to cv_profile.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE cv_profile
    ADD COLUMN avatar_url VARCHAR(500) NULL AFTER active_sections;

-- =====================================================================
-- End of V16__add_cv_avatar_url.sql
-- =====================================================================
