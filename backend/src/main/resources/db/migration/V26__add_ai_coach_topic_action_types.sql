-- =====================================================================
-- V26__add_ai_coach_topic_action_types.sql
-- Adds 4 new action_type values shared by ai_prompt_template and
-- ai_generation_log, one per AI Coach topic card on the welcome screen
-- (see AiWelcomeHero.jsx / aiTopics.js on the frontend):
--   * chat_cv_coach          - "Toi uu hoa CV/Thu xin viec"
--   * chat_interview_coach   - "Luyen tap phong van"
--   * chat_career_coach      - "Dinh huong nghe nghiep"
--   * chat_job_search_coach  - "Ky nang tim viec & Dam phan"
-- Plain 'chat' remains the catch-all used when no topic is selected and
-- as the fallback when a model has no specialized template configured
-- yet (see MyAiConversationService#findChatTemplate). V27 seeds the
-- actual prompt text for each of the 4 new values.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE ai_prompt_template
    MODIFY COLUMN action_type ENUM(
        'generate',
        'optimize',
        'match_jd',
        'translate',
        'grammar_check',
        'chat',
        'chat_cv_coach',
        'chat_interview_coach',
        'chat_career_coach',
        'chat_job_search_coach'
    ) NOT NULL;

ALTER TABLE ai_generation_log
    MODIFY COLUMN action_type ENUM(
        'generate',
        'optimize',
        'match_jd',
        'translate',
        'grammar_check',
        'chat',
        'chat_cv_coach',
        'chat_interview_coach',
        'chat_career_coach',
        'chat_job_search_coach'
    ) NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of V26__add_ai_coach_topic_action_types.sql
-- =====================================================================
