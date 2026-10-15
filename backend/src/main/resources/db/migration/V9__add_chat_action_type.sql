-- =====================================================================
-- V9__add_chat_action_type.sql
-- Adds 'chat' to the action_type ENUM shared by ai_prompt_template and
-- ai_generation_log, so the AI Coach chat feature can register a system
-- prompt per model and log every chat turn like every other AI action.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE ai_prompt_template
    MODIFY COLUMN action_type ENUM('generate','optimize','match_jd','translate','grammar_check','chat') NOT NULL;

ALTER TABLE ai_generation_log
    MODIFY COLUMN action_type ENUM('generate','optimize','match_jd','translate','grammar_check','chat') NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V9__add_chat_action_type.sql
-- =====================================================================
