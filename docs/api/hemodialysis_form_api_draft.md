# Hemodialysis Form API - Single-field invocation API contract (Hemodialysis Add New)

Scope & Purpose

This canonical contract covers the single-field exposure/invocation used by the UI to submit the Hemodialysis "Add New" form (single-field upserts and resume). It replaces ad-hoc notes and provides machine-consumable request/response shapes, headers, status codes, idempotency, transactional expectations, retry/failure semantics, duplicate handling and escalation guidance. Low-level persistence and migration registration decisions are recorded as Open Issues and deferred to TASK-004 and TASK-005.

Referenced artifacts

- Machine-readable form schema: docs/design/schemas/hemodialysis_add_new.schema.json (schema id and canonical JSON Schema are defined there).
- Schema-version handling guidance: docs/design/schema_versioning.md
- Retry/ambiguity guidance: docs/requirements/ambiguity_thresholds_clarification_guidelines.md

(Reuse artifact references noted in planning: docs/design/schemas/hemodialysis_add_new.schema.json@e72bf00daaad, docs/design/schema_versioning.md@e72bf00daaad, docs/requirements/ambiguity_thresholds_clarification_guidelines.md@801f24eccc8f)

1. Canonical HTTP method & path

- POST /api/v1/hemodialysis/forms/{form_id}/fields/{field_name}
  - Purpose: single-field upsert (create or update) for an in-progress form instance.
  - Note: final canonical base path ("/api/v1/hemodialysis") is proposed here; path approval is TODO in TASK-005.

- GET /api/v1/hemodialysis/forms/{form_id}
  - Purpose: retrieve full form instance and metadata including stored_schema_version, revision and audit pointers.

- POST /api/v1/hemodialysis/forms/{form_id}/resume
  - Purpose: explicit resume operation used by the UI when a form is blocked or requires migration.

2. Schema reference and versioning rules

- The server and client must agree on the schema identity found in docs/design/schemas/hemodialysis_add_new.schema.json. Every request that mutates form state MUST include the client's runtime schema_version in the request body (string, semantic versioning 3-part: MAJOR.MINOR.PATCH).
- Server compares the client's runtime schema_version to the stored_schema_version on the form.
  - If MAJOR differs: the server must treat this as incompatible (see SCHEMA_MISMATCH_MAJOR) and block the write by returning 409 Conflict.
  - If MAJOR is equal but MINOR or PATCH differ: server MAY auto-migrate if a migration is registered, MAY accept with fallback, or return guidance to the client. Migration behaviour is recorded in the response (MIGRATED or FALLBACK). See docs/design/schema_versioning.md for event semantics and migration expectations.
- The canonical source-of-truth for the form schema is docs/design/schemas/hemodialysis_add_new.schema.json. The server MUST record the stored_schema_version on every persisted form.

3. Required headers and content-type

- Authorization: Bearer <token>
  - Example: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Idempotency-Key: <opaque-string>
  - Example: Idempotency-Key: user-123-action-20260916T091000Z
  - Format guidance: human-readable prefix optional; server treats as opaque. Recommend UUIDv4 or stable client-generated string combining user id, form id and timestamp.
- Content-Type: application/json
- Accept: application/json
- Optional: X-Correlation-Id: <uuid> (server includes in logs and emitted events)

4. Request JSON shape (single-field upsert)

- Body schema (JSON):
  {
    "value": <any>,
    "schema_version": "MAJOR.MINOR.PATCH",
    "client_timestamp": "ISO-8601",
    "session_id": "optional-session-id",
    "actor_id": "optional-user-id"
  }

- Example request:
  POST /api/v1/hemodialysis/forms/00000000-0000-4000-8000-000000000001/fields/blood_flow_rate_ml_per_min
  Headers:
    Authorization: Bearer <token>
    Content-Type: application/json
    Idempotency-Key: save-req-123e4567-e89b-12d3-a456-426614174000
    X-Correlation-Id: 11111111-2222-3333-4444-555555555555

  Body:
  {
    "value": 350,
    "schema_version": "1.0.0",
    "client_timestamp": "2026-09-16T09:10:00Z",
    "session_id": "sess-abc-123",
    "actor_id": "user:alice"
  }

5. Canonical success response shapes

- 200 OK (normal apply)
  {
    "status": "OK",
    "field": "blood_flow_rate_ml_per_min",
    "applied_value": 350,
    "form_id": "00000000-0000-4000-8000-000000000001",
    "stored_schema_version": "1.0.0",
    "revision": 42,
    "idempotency_key": "save-req-123e4567-e89b-12d3-a456-426614174000"
  }

- 200 OK (MIGRATED)
  {
    "status": "MIGRATED",
    "migration_summary": { "from": "0.9.0", "to": "1.0.0", "changes": ["field renamed blood_flow -> blood_flow_rate_ml_per_min"] },
    "field": "blood_flow_rate_ml_per_min",
    "applied_value": 350,
    "stored_schema_version": "1.0.0",
    "revision": 43
  }

- 200 OK (FALLBACK - partial apply)
  {
    "status": "FALLBACK",
    "locked_fields": ["anticoagulation_type"],
    "field": "blood_flow_rate_ml_per_min",
    "applied_value": 350,
    "stored_schema_version": "1.0.0",
    "revision": 42
  }

6. Error classes, HTTP codes, and exact example payloads

- Validation error (400 Bad Request)
  - Conditions: malformed JSON, missing required body fields (value, schema_version), or syntactic type mismatch that prevents processing.
  - Example response:
    HTTP/1.1 400 Bad Request
    Content-Type: application/json
    {
      "error": "BAD_REQUEST",
      "message": "Missing required field 'value' or 'schema_version'",
      "details": { "field": "schema_version", "problem": "required" }
    }


- Authentication/Authorization (401 / 403)
  - 401 Unauthorized: missing or invalid token
    {
      "error": "UNAUTHORIZED",
      "message": "Authorization token missing or invalid."
    }
  - 403 Forbidden: token valid but scope insufficient
    {
      "error": "FORBIDDEN",
      "message": "Token lacks required scope 'forms:write'"
    }

- Validation semantics (422 Unprocessable Entity)
  - Conditions: payload passes syntactic validation but fails semantic business rules (out-of-range value, disallowed combination)
  - Example:
    HTTP/1.1 422 Unprocessable Entity
    {
      "error": "VALIDATION_ERROR",
      "message": "Value out of allowable range",
      "details": { "field": "blood_flow_rate_ml_per_min", "min": 50, "max": 500 }
    }

- Conflict / Duplicate & Schema mismatch (409 Conflict)
  - SCHEMA_MISMATCH_MAJOR (blocking): client's major version differs from stored form major version. Client MUST not retry without user/clinical action.
    HTTP/1.1 409 Conflict
    {
      "error": "SCHEMA_MISMATCH_MAJOR",
      "message": "Form schema incompatible. Manual intervention required.",
      "stored_schema_version": "0.9.0",
      "runtime_schema_version": "2.0.0",
      "action": "block"
    }
  - IDEMPOTENCY_CONFLICT: Idempotency-Key was seen with a different request body; server returns 409 to indicate client must reconcile.
    HTTP/1.1 409 Conflict
    {
      "error": "IDEMPOTENCY_CONFLICT",
      "message": "Idempotency-Key previously used with different payload.",
      "existing_response_summary": { "status": "OK", "field": "blood_flow_rate_ml_per_min", "applied_value": 300 },
      "action": "client_must_resubmit_with_new_key_or_verify_payload"
    }

- Transient server errors (5xx)
  - 500 Internal Server Error or 503 Service Unavailable when temporary. Include retryable flag.
    HTTP/1.1 503 Service Unavailable
    {
      "error": "TEMPORARY_ERROR",
      "message": "Service temporarily unavailable. Please retry.",
      "retryable": true
    }

7. Authentication & request-scoped context expectations

- Token scopes: write operations MUST present a token with scope forms:write. Read operations require forms:read. Tokens should identify actor (sub) claim used as actor_id when present.
- Context fields required (either as headers or body):
  - actor_id (best-effort): user id performing the action
  - session_id (optional): UI session identifier
  - X-Correlation-Id (recommended): for tracing and event correlation
- The server will populate audit entries with the actor_id, session_id (if supplied) and the authenticated principal extracted from the Authorization token.
- Implementation pattern: auth middleware (Server/src/middleware/authMiddleware.js) extracts token, validates scopes and sets req.context = { actorId, scopes, facilityId?, tokenClaims } for downstream use.

8. Idempotency semantics and middleware behaviour

- Requirement: Clients SHOULD supply Idempotency-Key on every distinct user action. Server MUST:
  - Treat Idempotency-Key as opaque.
  - If a request arrives with a previously unseen Idempotency-Key: process request, persist an idempotency record containing: idempotency_key, request_fingerprint (hash of normalized body), response_snapshot (status + body summary), actor_id, form_id, created_at, and TTL metadata.
  - If a request arrives with a known Idempotency-Key and the request_fingerprint matches the stored request_fingerprint: return the stored response_snapshot (same HTTP status code and body) without re-applying side-effects.
  - If a request arrives with a known Idempotency-Key but different request_fingerprint: respond with 409 IDEMPOTENCY_CONFLICT and include the existing_response_summary.

- Idempotency TTL guidance (recommendation): keep idempotency records for at least 72 hours to cover common client replays and short outages; recommended retention: 7 days for clinical audit purposes if storage allows. Final TTL and storage backend are unresolved and assigned to TASK-004/TASK-005.

- Example behaviour: Same key, same body => server returns 200 and same body. Same key, changed body => 409 IDEMPOTENCY_CONFLICT.

9. Transactional boundaries, consistency and compensation

- Atomic (must be in same transactional unit) where possible:
  - persist/update the form field value and the per-write audit entry (actor, timestamp, client_timestamp, idempotency_key, revision change)
  - emit an event to the event sink that represents the logical change (can be done after DB commit but must be correlated to commit id)
- Non-atomic but coordinated scenarios:
  - when external services or migrations are required during a single-field apply, the server should use a reliable outbox pattern or schedule an asynchronous migration task and return FALLBACK/MIGRATED responses according to migration outcome.
- Compensation strategy: when cross-service failure occurs after DB commit but before external side-effect, schedule compensating actions or emit compensating events. Exact transactional isolation levels, locking strategies and compensation responsibilities are unresolved and recorded in Open Issues for TASK-004/TASK-005.

10. Retry & failure semantics (client guidance)

- Error classification:
  - Retryable (automatic): network failures, 5xx transient errors with "retryable": true, and timeouts. Clients may automatically retry using exponential backoff.
  - Non-retryable (do NOT automatic retry): 4xx errors (400, 401, 403, 409, 422) except where documented as safe (e.g., idempotent replays of the same request are safe via Idempotency-Key).
- Recommended automatic retry policy (client):
  - Attempt up to 3 automatic retries for transient/network/5xx errors using exponential backoff with jitter: initial 500ms, multiplier 2, max delay 10s.
  - If retries exhausted and operation still failing: surface to nurse/operator with message: "Save failed due to server error; please retry or contact support." Use localization key hemo.save.error.server_retry_exhausted.
  - For idempotent operations (same Idempotency-Key): first automatic retry is safe; client should NOT generate a new Idempotency-Key for automatic retries. For user-initiated re-saves after user interaction, generate a fresh Idempotency-Key.
- UI interaction guidance (clinical): after two automatic retries fail, require nurse confirmation before further automatic attempts (to avoid repeated clinical side-effects). This guidance aligns with docs/requirements/ambiguity_thresholds_clarification_guidelines.md.

11. Duplicate-submission detection, logging and escalation

- Detection heuristics:
  - Exact duplicate: same Idempotency-Key and same request_fingerprint -> treated as replay.
  - Near-duplicate: different Idempotency-Key but same actor_id, form_id, field_name, and very-close timestamps (within configured window, e.g., 30s) -> log as near-duplicate for telemetry and optionally surface UI hint.
- Logging & telemetry events to emit (example names):
  - Hemodialysis.FieldSave.Received
  - Hemodialysis.FieldSave.Applied
  - Hemodialysis.FieldSave.DuplicateDetected
  - Hemodialysis.FieldSave.IdempotencyConflict
  - Hemodialysis.FieldSave.SchemaMigrationApplied
  - Hemodialysis.FieldSave.SchemaMismatchBlocked
  - Hemodialysis.FieldSave.PersistFailure
- Telemetry fields to include: form_id, field_name, actor_id (hashed if PII concerns), idempotency_key (hashed), stored_schema_version, runtime_schema_version, request_fingerprint, correlation_id, revision, duration_ms, error_code.
- Escalation criteria and operator flow:
  - If the same field is failing persistent writes for the same form more than N times in a 1-hour window (N configurable, recommend N=3), raise an automated alert to on-call and create a clinical escalation ticket flagged as high-priority. Include clinical-impact metadata.
  - For SCHEMA_MISMATCH_MAJOR that blocks resume for in-progress items flagged as "urgent", surface a UI escalation prompt with localization key hemo.save.error.schema_major_blocked_escalate and include guidance to contact Clinical Ops and the escalation mailing list: clinical-ops@example.internal (placeholder). Final contact points to be defined by Product/Clinical.

12. User-facing error messages and localization keys

- Validation failure (user-facing)
  - Message: "The value you entered is not valid. Please correct and try again."
    - Localization key: hemo.save.error.validation
  - Nurse-facing augmentation: "Field {field_name} failed validation: {reason}. See field help for permissible values."
    - Key: hemo.save.error.validation.detail

- Duplicate submission notice
  - Message: "This save appears to be a duplicate; the previous value was preserved."
    - Key: hemo.save.notice.duplicate

- Schema mismatch (blocking)
  - Message: "This form is incompatible with the current app version. Please contact Clinical Ops to reconcile."
    - Key: hemo.save.error.schema_major_blocked
  - Nurse-facing guidance: include stored_schema_version and runtime_schema_version, and instruct "Do not retry: await migration or assistance."
    - Key: hemo.save.error.schema_major_blocked.detail

- Temporary server error after retries
  - Message: "Unable to save right now. Your change is preserved locally and can be retried. If this persists, contact support." 
    - Key: hemo.save.error.server_retry_exhausted

- Allowed-null confirmation (when user clears a previously non-null required-but-allowed-null field)
  - Message: "You cleared a value that may be clinically significant. Confirm to proceed."
    - Key: hemo.save.confirm.allowed_null

13. Observability and logs

- Minimum events to emit (structured JSON to log sink):
  - Hemodialysis.FieldSave.Received { form_id, field_name, actor_id, idempotency_key, runtime_schema_version, client_timestamp, correlation_id }
  - Hemodialysis.FieldSave.Result { form_id, field_name, result_status, revision, duration_ms, error_code? }
  - Hemodialysis.FieldSave.IdempotencyConflict { idempotency_key, request_fingerprint, existing_response_summary }
  - Hemodialysis.FieldSave.SchemaMismatch { stored_schema_version, runtime_schema_version, severity }
- Metrics to track:
  - counter: hemodialysis.field_save.attempts
  - counter: hemodialysis.field_save.success
  - counter: hemodialysis.field_save.failure
  - histogram: hemodialysis.field_save.latency_ms
  - gauge: hemodialysis.field_save.pending_queue_length (if writes are queued)

14. Examples & end-to-end sequences

- Success sequence:
  1) Client sends POST /.../fields/blood_flow_rate_ml_per_min with Idempotency-Key K1 and value 350.
  2) Server validates, applies, commits, records idempotency entry and returns 200 OK with status OK and revision 42.
  3) Client may re-issue same request if it did not receive response; server returns stored response (200) and no duplicate side-effect.

- Validation error example (client missing schema_version):
  Client request body: { "value": 350 }
  Server response: 400 Bad Request with { "error": "BAD_REQUEST", "message": "Missing required field 'schema_version'" }

- Duplicate Idempotency-Key with different payload:
  Client first request: Idempotency-Key: K1 with value 300 -> 200 OK applied.
  Client second request: Idempotency-Key: K1 with value 350 -> 409 IDEMPOTENCY_CONFLICT (existing_response_summary included)

- Transient server error and retry:
  Server returns 503 { "error": "TEMPORARY_ERROR", "retryable": true }
  Client retries automatically with same Idempotency-Key up to 3 times using exponential backoff. If still failing, surface to user with hemo.save.error.server_retry_exhausted.


15. Duplicate-submission escalation and UI guidance

- UI should surface non-blocking duplicates silently as a toast using key hemo.save.notice.duplicate but record an entry in the form activity stream.
- For repeated failures or clinically impactful duplicates (e.g., multiple different values saved by different actors within a short window), surface an escalation modal with hemo.save.error.duplicate_escalate and provide contact action to create a support ticket.

16. Open issues / unresolved persistence questions (TO BE ASSIGNED)

The following low-level persistence, locking and retention choices are intentionally deferred to TASK-004 and TASK-005. They must be resolved before final production roll-out.

- Idempotency storage backend: durable table vs ephemeral cache (Redis) and replication/HA strategy. (Assign: TASK-004)
- Idempotency record TTL enforcement policy and retention for auditing vs storage cost (recommend: 72 hours operational TTL, 7 days archival). (Assign: TASK-004)
- Exact transactional isolation and locking strategy for per-field writes: optimistic concurrency with revision numbers vs pessimistic row locks. (Assign: TASK-005)
- Cross-service transaction compensation strategy and responsibility (who schedules compensations and how to resume failed migrations). (Assign: TASK-005)
- Migration registration and discovery (how migration functions are registered, version mapping and who may deploy them). (Assign: TASK-004)
- Escalation contact points and on-call routing for clinical-impact alerts (product/ops to finalize). (Assign: PRODUCT / CLINICAL OPS - record placeholder in TASK-005.)

17. Test guidance

- Tests exercising these semantics should live under Server/src/tests and include unit tests for idempotency middleware, schema version checks, and integration tests that simulate duplicate keys and transient failures. See test framework: Server/src/tests/*. See also src/idempotency/keyRegistry.js unit tests already present as guidance.

18. Approval and next steps

- This contract is a proposal. Path and header choices are subject to TASK-005 approval where noted. Low-level persistence and TTL decisions are deferred to TASK-004 and TASK-005 as listed above.

Appendix: Quick reference

- Required headers: Authorization, Content-Type: application/json, Idempotency-Key, X-Correlation-Id (optional)
- Required request field: schema_version in body (MAJOR.MINOR.PATCH)
- Success status codes: 200 OK (OK, MIGRATED, FALLBACK)
- Client error codes: 400 BAD_REQUEST, 401 UNAUTHORIZED, 403 FORBIDDEN, 409 CONFLICT (SCHEMA_MISMATCH_MAJOR, IDEMPOTENCY_CONFLICT), 422 VALIDATION_ERROR
- Server error codes: 500 INTERNAL_SERVER_ERROR, 503 SERVICE_UNAVAILABLE (retryable)

