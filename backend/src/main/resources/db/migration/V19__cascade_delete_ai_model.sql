-- =====================================================================
-- V19: Enable CASCADE on delete for ai_model references
--
-- Allows deleting an AI model from admin without foreign key constraint
-- failures on ai_conversation, ai_prompt_template, and ai_generation_log.
-- =====================================================================

-- 1. ai_conversation -> ai_model
ALTER TABLE ai_conversation
    DROP FOREIGN KEY fk_conversation_model;
ALTER TABLE ai_conversation
    ADD CONSTRAINT fk_conversation_model
        FOREIGN KEY (model_id) REFERENCES ai_model(id) ON DELETE CASCADE;

-- 2. ai_prompt_template -> ai_model
ALTER TABLE ai_prompt_template
    DROP FOREIGN KEY fk_prompt_model;
ALTER TABLE ai_prompt_template
    ADD CONSTRAINT fk_prompt_model
        FOREIGN KEY (model_id) REFERENCES ai_model(id) ON DELETE CASCADE;

-- 3. ai_generation_log -> ai_prompt_template
ALTER TABLE ai_generation_log
    DROP FOREIGN KEY fk_genlog_prompt;
ALTER TABLE ai_generation_log
    ADD CONSTRAINT fk_genlog_prompt
        FOREIGN KEY (prompt_template_id) REFERENCES ai_prompt_template(id) ON DELETE CASCADE;
