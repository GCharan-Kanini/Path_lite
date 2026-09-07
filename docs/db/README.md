# Database Persistence Artifacts (US-002 Vertical Slice)

## Overview

This folder contains persistence-layer artifacts for US-002:

- canonical database schema,
- deterministic migration script,
- repository/data-access contracts,
- transaction and compensation guidance.

## Artifact Map

- `schema/vertical_slice_schema.sql`  
  Canonical normalized schema with keys, constraints, indexes, and PII/sensitive annotations.

- `migrations/001_create_vertical_slice_tables.sql`  
  Initial deterministic migration sequence. Designed to be repeatable/idempotent where PostgreSQL supports `IF NOT EXISTS`.

- `repository/contracts/vertical_slice_repository_contract.md`  
  Method intent signatures, idempotency requirements, transactional expectations, and error/retry semantics.

- `transaction/transaction_strategy_and_compensation.md`  
  ACID single-transaction patterns plus compensating/rollback strategies for cross-resource flows.

## Migration Execution (Development / Testing)

### Option A: psql

```bash
psql "$DATABASE_URL" -f docs/db/migrations/001_create_vertical_slice_tables.sql
```

### Option B: local docker-postgres target

```bash
docker exec -i <postgres-container> psql -U <user> -d <database> < docs/db/migrations/001_create_vertical_slice_tables.sql
```

### Repeatable bootstrap note

The migration uses idempotent-safe patterns (`IF NOT EXISTS`) and deterministic ordering so it can be re-applied in ephemeral development/testing databases.

## Contract-to-Implementation Mapping Responsibilities

- Service/application layer owns orchestration and passes validated DTOs + idempotency keys.
- Repository implementation (TypeORM) owns transaction boundaries for multi-table writes.
- Idempotency repository owns key reservation, completion snapshots, and replay behavior.
- Error mapping should classify failures into retryable and non-retryable categories as defined in the contract document.

## Unit Test and Integration Test Guidance

### Unit tests

- repository contract conformance test for each public method signature intent;
- idempotency test for replay behavior and conflict detection;
- error classification test for transient vs permanent failures.

### Integration tests

- transaction rollback test: force failure mid-transaction and verify zero partial commits;
- idempotency test: same request + same idempotency key persists one logical outcome;
- transaction failure scenario test: transient DB conflict returns retryable classification and supports safe retry.

## Security and Compliance Review Checklist

Before implementation sign-off:

1. Confirm PII/sensitive column annotations were reviewed.
2. Confirm no PHI is persisted in this vertical slice without updated controls.
3. Confirm retention/audit expectations are aligned with `docs/compliance/EP-001_security_signoff.md`.
4. Confirm repository error and retry behavior is reflected in operational runbooks.
