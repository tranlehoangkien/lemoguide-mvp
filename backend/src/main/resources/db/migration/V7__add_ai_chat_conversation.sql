-- =====================================================================
-- V7__add_ai_chat_conversation.sql
-- Adds conversation + message storage for the "Tro ly AI LemoGuide" chat
-- feature. Reuses ai_model / ai_prompt_template / ai_generation_log
-- already created in V6 - this migration only adds the tables needed
-- to persist a multi-turn conversation.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. ai_conversation
--    One row per chat thread. "category" matches the tabs in the UI:
--    Tat ca / Toi uu CV / Luyen phong van / Lo trinh nghe
-- ---------------------------------------------------------------------
CREATE TABLE ai_conversation (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id      BIGINT UNSIGNED NOT NULL,
    model_id        BIGINT UNSIGNED NOT NULL,          -- model selected when conversation started
    category        ENUM('cv_optimization','interview_practice','career_roadmap','general')
                    NOT NULL DEFAULT 'general',
    title           VARCHAR(200)    NULL,               -- auto-generated from first message, editable
    is_pinned       BOOLEAN         NOT NULL DEFAULT FALSE,
    last_message_at DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,
    CONSTRAINT fk_conversation_account
        FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_model
        FOREIGN KEY (model_id) REFERENCES ai_model(id) ON DELETE RESTRICT,
    INDEX idx_conversation_account (account_id, last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. ai_message
--    Every turn in the conversation, both user and assistant.
-- ---------------------------------------------------------------------
CREATE TABLE ai_message (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id     BIGINT UNSIGNED NOT NULL,
    role                ENUM('user','assistant','system') NOT NULL,
    content             MEDIUMTEXT      NOT NULL,
    attachment_url       VARCHAR(500)    NULL,           -- for "Dinh kem" (CV file, image...)
    generation_log_id   BIGINT UNSIGNED NULL,            -- set when role = 'assistant', links to ai_generation_log
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_conversation
        FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_genlog
        FOREIGN KEY (generation_log_id) REFERENCES ai_generation_log(id) ON DELETE SET NULL,
    INDEX idx_message_conversation (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V7__add_ai_chat_conversation.sql
-- =====================================================================
