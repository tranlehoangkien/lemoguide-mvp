ALTER TABLE network_message
 ADD COLUMN shared_profile_id BIGINT UNSIGNED NULL,
 ADD COLUMN shared_project_id BIGINT UNSIGNED NULL,
 ADD CONSTRAINT fk_network_message_profile FOREIGN KEY (shared_profile_id) REFERENCES account(id) ON DELETE SET NULL,
 ADD CONSTRAINT fk_network_message_project FOREIGN KEY (shared_project_id) REFERENCES project(id) ON DELETE SET NULL;
