-- LemoNetwork phase 1 + 2: editing, threaded replies, milestone auto-share, study cohorts and accountability buddies.
-- One ADD per ALTER so the same statements also run on the H2 database used by NetworkFlowTest.

ALTER TABLE network_post ADD COLUMN edited_at DATETIME NULL;
ALTER TABLE network_comment ADD COLUMN edited_at DATETIME NULL;
-- Replies are one level deep: parent_id always points at a top-level comment of the same post.
ALTER TABLE network_comment ADD COLUMN parent_id BIGINT UNSIGNED NULL;
ALTER TABLE network_comment ADD CONSTRAINT fk_network_comment_parent FOREIGN KEY (parent_id) REFERENCES network_comment(id) ON DELETE CASCADE;
-- Opt-in: when a roadmap week is marked done, publish a MILESTONE post automatically.
ALTER TABLE network_profile ADD COLUMN auto_share_milestones BOOLEAN NOT NULL DEFAULT FALSE;

-- Study cohorts are derived from roadmaps: everyone studying the same catalog course (kind COURSE, ref_key = course id)
-- or aiming at the same target role (kind ROLE, ref_key = normalized role). Membership is opt-in.
CREATE TABLE network_cohort (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 kind VARCHAR(10) NOT NULL,
 ref_key VARCHAR(200) NOT NULL,
 title VARCHAR(200) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (kind, ref_key)
);
CREATE TABLE network_cohort_member (
 cohort_id BIGINT UNSIGNED NOT NULL,
 account_id BIGINT UNSIGNED NOT NULL,
 last_read_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
 joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (cohort_id, account_id),
 FOREIGN KEY (cohort_id) REFERENCES network_cohort(id) ON DELETE CASCADE,
 FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);
CREATE TABLE network_cohort_message (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 cohort_id BIGINT UNSIGNED NOT NULL,
 sender_id BIGINT UNSIGNED NOT NULL,
 kind VARCHAR(10) NOT NULL DEFAULT 'TEXT',
 content VARCHAR(3000) NOT NULL,
 hidden BOOLEAN NOT NULL DEFAULT FALSE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (cohort_id) REFERENCES network_cohort(id) ON DELETE CASCADE,
 FOREIGN KEY (sender_id) REFERENCES account(id) ON DELETE CASCADE,
 INDEX idx_network_cohort_message (cohort_id, id)
);

-- Accountability buddy: at most one ACCEPTED pair per person (enforced in NetworkBuddyService).
CREATE TABLE network_buddy (
 low_id BIGINT UNSIGNED NOT NULL,
 high_id BIGINT UNSIGNED NOT NULL,
 requester_id BIGINT UNSIGNED NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (low_id, high_id),
 FOREIGN KEY (low_id) REFERENCES account(id) ON DELETE CASCADE,
 FOREIGN KEY (high_id) REFERENCES account(id) ON DELETE CASCADE
);
