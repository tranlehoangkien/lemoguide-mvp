-- LemoNetwork: share a CV inside the community.
-- A member may feature one of their own CVs on their community profile, or attach one to a direct message.
-- Only CVs that are publicly shareable (is_active, publish_mode = public_link, no share password, not expired)
-- qualify; NetworkCvService checks this again on every read, so switching a CV back to draft revokes access.
-- One ADD per ALTER so the statements also run on the H2 database used by NetworkFlowTest.

ALTER TABLE network_profile ADD COLUMN featured_cv_id BIGINT UNSIGNED NULL;
ALTER TABLE network_profile ADD CONSTRAINT fk_network_profile_cv FOREIGN KEY (featured_cv_id) REFERENCES cv_profile(id) ON DELETE SET NULL;
ALTER TABLE network_message ADD COLUMN shared_cv_id BIGINT UNSIGNED NULL;
ALTER TABLE network_message ADD CONSTRAINT fk_network_message_cv FOREIGN KEY (shared_cv_id) REFERENCES cv_profile(id) ON DELETE SET NULL;
