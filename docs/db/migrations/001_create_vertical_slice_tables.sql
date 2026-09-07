-- Migration: 001_create_vertical_slice_tables.sql
-- Vertical slice: US-002 persistence baseline
-- Deterministic order / sequence:
--   1) Parent table
--   2) Child tables with foreign keys
--   3) Supporting idempotency + audit tables
--   4) Secondary indexes
--
-- Repeatable / idempotent behavior:
-- - Uses IF NOT EXISTS for tables and indexes where possible.
-- - Safe to re-run in development/testing bootstrap flows.

BEGIN;

CREATE TABLE IF NOT EXISTS intake_requests (
    intake_request_id UUID PRIMARY KEY,
    external_reference VARCHAR(100) NOT NULL UNIQUE,
    requester_email VARCHAR(320) NOT NULL,
    requester_display_name VARCHAR(200) NOT NULL,
    request_status VARCHAR(40) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_intake_requests_status
        CHECK (request_status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS intake_request_items (
    intake_request_item_id UUID PRIMARY KEY,
    intake_request_id UUID NOT NULL,
    requirement_code VARCHAR(80) NOT NULL,
    requirement_summary TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_intake_request_items_request
        FOREIGN KEY (intake_request_id)
        REFERENCES intake_requests (intake_request_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_intake_request_items_quantity CHECK (quantity > 0),
    CONSTRAINT uq_request_requirement UNIQUE (intake_request_id, requirement_code)
);

CREATE TABLE IF NOT EXISTS intake_request_idempotency_keys (
    idempotency_key_id UUID PRIMARY KEY,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    operation_name VARCHAR(80) NOT NULL,
    request_payload_hash VARCHAR(128) NOT NULL,
    intake_request_id UUID,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_code INTEGER,
    response_snapshot JSONB,
    CONSTRAINT fk_idempotency_request
        FOREIGN KEY (intake_request_id)
        REFERENCES intake_requests (intake_request_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS intake_request_audit_events (
    intake_request_audit_event_id UUID PRIMARY KEY,
    intake_request_id UUID NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    event_payload JSONB NOT NULL,
    actor_identifier VARCHAR(160) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_request
        FOREIGN KEY (intake_request_id)
        REFERENCES intake_requests (intake_request_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_intake_requests_status_submitted
    ON intake_requests (request_status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_intake_request_items_request
    ON intake_request_items (intake_request_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_operation_seen
    ON intake_request_idempotency_keys (operation_name, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_request_occurred
    ON intake_request_audit_events (intake_request_id, occurred_at DESC);

COMMIT;
