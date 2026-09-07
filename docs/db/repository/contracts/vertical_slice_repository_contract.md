# US-002 Vertical Slice Repository Contracts

## Purpose

This document defines repository/data-access contracts for the US-002 vertical slice. It specifies method intent signatures, idempotency requirements, transactional expectations, and error/retry semantics for Node.js + TypeScript + TypeORM implementations.

## Contract Principles

- Each write method that can be retried by clients **must** accept an idempotency key.
- Multi-table writes **must** execute in a single database transaction.
- Repository methods should return domain-level outcomes and throw typed persistence exceptions for failures.

## Interface-Style Method Signatures (Intent)

```ts
interface IntakeRequestRepository {
  createIntakeRequest(input: CreateIntakeRequestInput, idempotencyKey: string): Promise<CreateIntakeRequestResult>;
  updateRequestStatus(input: UpdateRequestStatusInput, idempotencyKey: string): Promise<UpdateRequestStatusResult>;
  findById(intakeRequestId: string): Promise<IntakeRequest | null>;
  findByExternalReference(externalReference: string): Promise<IntakeRequest | null>;
}

interface IntakeRequestAuditRepository {
  appendAuditEvent(input: AppendAuditEventInput): Promise<void>;
  listByRequestId(intakeRequestId: string): Promise<IntakeRequestAuditEvent[]>;
}

interface IdempotencyRepository {
  reserveKey(operationName: string, idempotencyKey: string, payloadHash: string): Promise<IdempotencyReservation>;
  completeKey(idempotencyKey: string, responseCode: number, responseSnapshot: unknown): Promise<void>;
  getCompletedResult(operationName: string, idempotencyKey: string): Promise<CompletedIdempotentResult | null>;
}
```

## Transactional Behavior Expectations

### createIntakeRequest

- Transactional method: **yes**.
- Single transaction writes:
  1. reserve/validate idempotency key,
  2. insert `intake_requests`,
  3. insert `intake_request_items`,
  4. insert initial audit event,
  5. persist idempotent completion snapshot.
- Commit only if all steps succeed; otherwise rollback entire unit.

### updateRequestStatus

- Transactional method: **yes**.
- Single transaction updates request status + appends status-change audit event + marks idempotency completion state.

### appendAuditEvent

- Transactional method: optional standalone write; required to join caller transaction when one is already active.

## Idempotency Inputs and Rules

- Required input: `idempotencyKey` for every externally-triggered mutating operation.
- Key uniqueness scope: `(operationName, idempotencyKey)`.
- A replay with matching payload hash returns the prior successful result.
- A replay with conflicting payload hash fails with non-retryable conflict.

## Error Semantics and Retry Guidance

| Error Type | Example Cause | Retry Guidance |
|---|---|---|
| `PersistenceValidationError` | Invalid status transition, missing mandatory input | Do not retry until payload is corrected |
| `IdempotencyConflictError` | Same idempotency key with different payload hash | Do not retry with same key; client must resolve conflict |
| `TransientPersistenceError` | Serialization failure, brief connectivity issue, deadlock victim | Retry with same idempotency key and bounded exponential backoff |
| `PermanentPersistenceError` | Constraint violation proving request cannot succeed as-is | Do not retry unchanged request |

## Unit Test and Integration Test Guidance

### Unit test focus

- verify repository method validation and error mapping;
- verify idempotency key replay logic returns prior response;
- verify idempotency conflict emits `IdempotencyConflictError`.

### Integration test focus

- idempotency test: same `createIntakeRequest` payload + same key returns one logical write;
- transaction rollback test: injected failure after item insert causes no persisted request/items/audit rows;
- transaction failure scenario test: deadlock/serialization error surfaces as retryable transient error.
