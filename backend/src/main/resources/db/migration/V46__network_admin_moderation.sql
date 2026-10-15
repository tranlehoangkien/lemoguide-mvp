-- LemoNetwork admin: tell content hidden by a moderator apart from content its author deleted (both set hidden=TRUE),
-- so admins can restore only what they hid. One ADD per ALTER so the statements also run on H2 (NetworkFlowTest).
ALTER TABLE network_post ADD COLUMN hidden_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE network_comment ADD COLUMN hidden_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Content hidden through a report decision before this migration.
UPDATE network_post SET hidden_by_admin = TRUE
WHERE hidden = TRUE AND id IN (SELECT target_id FROM network_report WHERE kind = 'POST' AND status = 'HIDE');
UPDATE network_comment SET hidden_by_admin = TRUE
WHERE hidden = TRUE AND id IN (SELECT target_id FROM network_report WHERE kind = 'COMMENT' AND status = 'HIDE');
