-- =====================================================================
-- V8__add_groq_ai_provider.sql
-- Adds 'groq' to ai_model.provider so Groq-hosted models can be
-- registered through the admin "Model AI & API Key" page instead of
-- falling back to the generic 'other' value.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE ai_model
    MODIFY COLUMN provider ENUM('openai','anthropic','google','groq','other') NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V8__add_groq_ai_provider.sql
-- =====================================================================
