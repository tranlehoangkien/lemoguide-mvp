-- =====================================================================
-- V14__unlimited_ai_credits.sql
-- The AI Coach chat feature (MyAiConversationService.sendMessage) no
-- longer checks or decrements account.ai_credits_remaining — sending is
-- now unmetered; the only thing that stops it is the AI provider call
-- itself failing. This migration:
--   1. Raises the column default from 10 to the "unlimited" sentinel
--      (Account.UNLIMITED_AI_CREDITS = 999,999,999) for new accounts.
--   2. Brings every existing account up to that same sentinel, so no one
--      is still sitting at (or near) the old exhausted/near-exhausted
--      balance from before this change.
-- The ai_credit_transaction ledger and its admin CRUD are left in place
-- (unused for now) in case metering is ever reintroduced.
-- =====================================================================

SET NAMES utf8mb4;

ALTER TABLE account
    MODIFY COLUMN ai_credits_remaining INT UNSIGNED NOT NULL DEFAULT 999999999;

UPDATE account SET ai_credits_remaining = 999999999;

-- =====================================================================
-- End of V14__unlimited_ai_credits.sql
-- =====================================================================
