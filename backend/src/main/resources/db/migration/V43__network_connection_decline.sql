-- A declined connection request is remembered so the requester cannot re-send it immediately
-- (declining deletes the network_connection row, which otherwise let invitations be spammed).
CREATE TABLE network_connection_decline (
 requester_id BIGINT UNSIGNED NOT NULL,
 recipient_id BIGINT UNSIGNED NOT NULL,
 declined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (requester_id, recipient_id),
 FOREIGN KEY (requester_id) REFERENCES account(id) ON DELETE CASCADE,
 FOREIGN KEY (recipient_id) REFERENCES account(id) ON DELETE CASCADE
);
