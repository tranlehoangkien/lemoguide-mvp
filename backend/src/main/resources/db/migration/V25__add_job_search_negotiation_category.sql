-- =====================================================================
-- V25__add_job_search_negotiation_category.sql
-- Adds 'job_search_negotiation' to the ai_conversation.category ENUM, so
-- the 4th AI Coach topic card ("Ky nang tim viec & Dam phan" - see
-- aiTopics.js on the frontend) has its own category distinct from
-- 'general', which now means "no topic selected yet" only.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE ai_conversation
    MODIFY COLUMN category ENUM(
        'cv_optimization',
        'interview_practice',
        'career_roadmap',
        'job_search_negotiation',
        'general'
    ) NOT NULL DEFAULT 'general';

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V25__add_job_search_negotiation_category.sql
-- =====================================================================
