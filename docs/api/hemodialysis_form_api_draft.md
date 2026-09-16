# Hemodialysis Form API - Draft (single-field exposure and resume behaviour)

Purpose

This document drafts the HTTP API surface the UI and backend will use for single-field saves, form resume, and schema-version-aware operations. It focuses on idempotency expectations and error semantics related to schema version mismatches. This is a draft and intentionally leaves low-level persistence details for TASK-004/TASK-005.

1. Principles

- The UI should be able to save single-field edits (low-bandwidth, optimistic updates).
- Each single-field write is idempotent via either an "Idempotency-Key" header or a client-provided per-change id.
- The server performs a schema-version check on any operation that mutates an in-progress form and returns structured errors for schema mismatches.

2. Endpoints (draft)

- GET /api/v1/hemodialysis/forms/{form_id}
  - Purpose: retrieve the full in-progress form instance and metadata including schema_version.
  - Response: 200 with JSON body { form: <object>, schema_version: "X.Y.Z" }

- POST /api/v1/hemodialysis/forms/{form_id}/fields/{field_name}
  - Purpose: single-field upsert for an in-progress form.
  - Headers:
    - Authorization: Bearer <token>
    - Idempotency-Key: <opaque-string> (recommended for clients)
  - Body: { "value": <any>, "schema_version": "X.Y.Z", "client_timestamp": "ISO-8601" }
  - Behaviour:
    - Server compares supplied schema_version (client's runtime) with stored_schema_version for the form.
    - If major versions differ: return 409 Conflict with body { "error": "SCHEMA_MISMATCH_MAJOR", "stored_schema_version": "A.B.C", "runtime_schema_version": "X.Y.Z", "action": "block" }
    - If same major but migration needed: attempt migration server-side if a migration function is registered. If migration succeeds, apply field update and return 200 with { "status": "MIGRATED", "migrated_to": "X.Y.Z", "migration_summary": { ... } }
    - If migration not available and safe fallback is possible: return 200 with { "status": "FALLBACK", "locked_fields": [ ... ] } and still apply non-conflicting updates.
    - Normal success: 200 { "status": "OK", "field": "<field_name>", "applied_value": <value> }
  - Error codes:
    - 400 Bad Request: invalid payload, type mismatch
    - 401 Unauthorized: missing/invalid token
    - 409 Conflict: SCHEMA_MISMATCH_MAJOR
    - 422 Unprocessable Entity: semantic validation failed (e.g., value out of range)

- POST /api/v1/hemodialysis/forms/{form_id}/resume
  - Purpose: request a resume operation. Server performs schema checks and returns structured outcome.
  - Body: { "schema_version": "X.Y.Z", "requester_id": "user-id", "correlation_id": "optional" }
  - Responses:
    - 200 OK: { "status": "OK", "form": <full-form-object>, "note": "migrated"|"none" }
    - 200 OK (migrated): { "status": "MIGRATED", "migration_summary": { ... }, "form": <migrated-form> }
    - 200 OK (fallback): { "status": "FALLBACK", "locked_fields": [ ... ], "form": <partial-form> }
    - 409 Conflict: { "status": "BLOCKED", "reason": "MAJOR_VERSION_MISMATCH", "stored_schema_version": "A.B.C", "runtime_schema_version": "X.Y.Z" }

3. Idempotency and concurrency

- Clients SHOULD send an Idempotency-Key header for each distinct user action. The server must guarantee that repeated requests with the same Idempotency-Key and identical body have no additional side-effects and return the same outcome.
- The server should provide optimistic concurrency control on form-level modification (e.g., last_modified_at or an incrementing revision number) to avoid lost updates when multiple clients edit the same form.

4. Error semantics related to schema-version mismatches

- SCHEMA_MISMATCH_MAJOR (HTTP 409): Unrecoverable incompatibility. Client must not attempt retry without user action. UI should show guidance.
- SCHEMA_MISMATCH_MINOR (returned inside 200/FALLBACK or MIGRATED response): Minor or patch differences; server may auto-migrate or accept with fallback. UI should surface migration outcome and any locked fields.

5. Events and side-effects

- The server must emit the schema events documented in docs/design/schema_versioning.md when relevant (SchemaMismatchDetected, SchemaMigrationApplied, SchemaResumeBlocked, etc.) to the project's event store/logging sink.
- Event emissions must include correlation_id when provided by the client.

6. Unresolved / Out of scope details (for TASK-004 / TASK-005)

- Concrete migration function registration and discovery mechanism (how the server knows which migrations to run) is not specified here.
- Exact database schema for append-only event storage and retention/archival policy.
- Authentication/authorization scopes for who may trigger migrations or force-resume blocked forms.
- UI localization strings and exact confirmation modal copy.

7. Examples

- Single-field save (client request):
  POST /api/v1/hemodialysis/forms/00000000-0000-4000-8000-000000000001/fields/blood_flow_rate_ml_per_min
  Headers: Idempotency-Key: save-req-123
  Body: { "value": 350, "schema_version": "1.0.0", "client_timestamp": "2026-09-16T09:10:00Z" }

  Possible server responses:
  - 200 { "status": "OK", "field": "blood_flow_rate_ml_per_min", "applied_value": 350 }
  - 409 { "error": "SCHEMA_MISMATCH_MAJOR", "stored_schema_version": "0.9.0", "runtime_schema_version": "1.0.0" }

8. Next steps

- Backend: implement conservative resume endpoint and event emission.
- Frontend: implement schema_version check on form load and Idempotency-Key on single-field saves.
- Product/Clinical: finalize confirmation modal copy and list of fields that require explicit confirmation when null.
