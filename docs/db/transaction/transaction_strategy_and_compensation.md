# Transaction Strategy and Compensation (US-002)

## Goal

Define transactional strategy for persistence operations so that writes are atomic and consistent, and define compensating actions when a single transaction cannot span all resources.

## ACID Strategy for Single-Database Operations

All operations that mutate more than one table in PostgreSQL must use a single-transaction boundary to preserve ACID behavior:

- **Atomic**: all table writes succeed or all are rolled back.
- **Consistent**: schema constraints and status transition rules are never partially applied.
- **Isolated**: concurrent writes are handled using transaction isolation and retry for transient conflicts.
- **Durable**: committed writes survive process restarts.

### Single-transaction flow: create intake request

This is a single-transaction multi-table workflow.

1. Begin transaction.
2. Reserve idempotency key row (`intake_request_idempotency_keys`).
3. Insert parent row (`intake_requests`).
4. Insert child rows (`intake_request_items`).
5. Insert audit row (`intake_request_audit_events`).
6. Mark idempotency completion snapshot.
7. Commit transaction.
8. On any error: rollback transaction and return classified error.

## Transaction Controls

- Preferred isolation: `READ COMMITTED` for baseline; increase to `SERIALIZABLE` where required by correctness analysis.
- Retry policy: retry only transient failures (e.g., deadlock, serialization failure) with bounded backoff.
- Idempotency key must be reused for retries to avoid duplicate effects.

## Cross-Resource Non-Atomic Cases

If workflow spans database + external system (for example, outbound notification queue outside same DB transaction), use a compensating strategy.

### Compensation pattern

- Persist authoritative DB state first (transaction commit).
- Attempt external side effect after commit.
- If side effect fails, enqueue a compensating action and mark operation for recovery.

### Compensation pseudocode

```text
algorithm processRequestWithExternalDispatch(command, idempotencyKey):
  begin single DB transaction
    reserve idempotency key
    upsert intake request and items
    append audit event "REQUEST_PERSISTED"
    commit idempotency completion for DB portion
  commit transaction

  try externalDispatcher.send(command)
    append audit event "EXTERNAL_DISPATCH_SUCCEEDED"
  catch dispatchError
    append audit event "EXTERNAL_DISPATCH_FAILED"
    enqueue compensation job {
      action: "ROLLBACK_EXTERNAL_EXPECTATION",
      intakeRequestId,
      idempotencyKey,
      reason: dispatchError
    }
    return partial-success with recovery-required flag
```

### Example compensating actions

- Mark request status as `IN_REVIEW` (or recovery state) until external dispatch succeeds.
- Trigger retry worker with capped retry count and alert threshold.
- Publish manual intervention ticket if retries exhausted.

## Test Guidance (Unit and Integration)

### Unit test guidance

- verify transactional orchestrator calls rollback on thrown mid-flow exceptions;
- verify only transient errors are tagged retryable;
- verify compensation job payload includes `idempotencyKey` and request identifier.

### Integration test guidance

- rollback test: force failure between item insert and audit insert; assert no rows committed;
- idempotency test: replay same write request with same key and ensure single persisted outcome;
- transaction failure scenario test: induce serialization failure and assert retry path executes.
