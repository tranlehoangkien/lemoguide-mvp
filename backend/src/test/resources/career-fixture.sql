-- career_proposal is JDBC-only (no JPA entity), so the entity-built H2 test schema lacks it. Mirrors V38.
CREATE TABLE IF NOT EXISTS career_proposal (
    id VARCHAR(36) PRIMARY KEY,
    account_id BIGINT NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    proposal_json CLOB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
