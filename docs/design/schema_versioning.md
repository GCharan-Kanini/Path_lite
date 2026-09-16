# Schema Versioning and Runtime Behaviour (Hemodialysis Forms)

Overview

This document records the chosen machine-readable schema format, schema conventions, allowed-null semantics, UI mapping, and the runtime behaviour for schema-version mismatches when resuming or editing in-progress Hemodialysis forms. It also specifies the backend event recording requirements and example payloads for audit and troubleshooting.

1. Chosen schema format and rationale

- Format: JSON Schema draft-07 (http://json-schema.org/draft-07/schema#).
- Rationale: draft-07 provides broad tooling and library support across frontend and backend stacks used in this project (React/Node.js). It supports the validation features we need (type, enum, pattern, ranges) and is stable for production consumption. We deliberately use a constrained profile of draft-07 and rely on custom metadata properties (namespaced as x- or prefixed) for UI and operational hints to avoid introducing non-portable validation behaviour.

2. Conventions

- schema_version field:
  - Name: "schema_version"
  - Type: string, semantic versioning in MAJOR.MINOR.PATCH (regex: ^\d+\.\d+\.\d+$).
  - Rationale: semantic versions are human-readable and support backward-compatible (minor/patch) vs breaking (major) changes.

- Field-level metadata:
  - Use JSON Schema native constructs for nullable types (type: ["string","null"]) where null is permissible.
  - Additionally, include a non-normative hint property "x-allowed-null": true|false on fields where nullability has UI/operational significance (confirmation flows, explicit user intent). This is an implementation hint for UI and backend migrations and is not validated by standard validators.
  - Use "x-enum-canonical" where enum values need canonical clinical mapping separate from UI labels (keyed mapping: client-value -> canonical-value).
  - Use "x-ui-*" hints sparingly for control suggestions (e.g., x-ui: { control: "select", widget: "autocomplete" }). These must be treated as hints, not contract.

- Audit metadata:
  - Each form instance MUST include an "audit" object capturing at minimum: created_by, created_at (top-level), last_modified_by, last_modified_at (inside audit). These fields are required for traceability and to support schema event recording.

3. Allowed-null semantics and UI mapping

- Representation: When a field can legitimately be null, the schema SHALL include null in the field type and also set "x-allowed-null": true.
  - Example: "blood_flow_rate_ml_per_min": { "type": ["integer","null"], "x-allowed-null": true }
- UI mapping and control pattern:
  - Fields with x-allowed-null: true must display an explicit "Not recorded / Unknown" control option in the UI.
  - If a required clinical field is left null by the user, the UI MUST require an explicit confirmation modal explaining the clinical implication and capturing an optional "confirmation_reason" free-text before allowing save. The confirmation and its text (if provided) must be stored in the audit.change_reason field.
  - The UI shall treat null as a deliberate action (not the same as omission) when x-allowed-null is true; telemetry should record whether the value was intentionally set null.
- Confirmation-summary layout expectations (for design/engineering):
  - The confirmation modal should show:
    - Field label
    - Current patient context (patient_id, form_id)
    - A short explanation why null is allowed and any policy text
    - An optional free-text "Reason" (max 1024 chars)
    - Buttons: "Cancel" (returns user to form), "Confirm and Save" (saves with null and records audit.change_reason)

4. Schema-version mismatch / resume behaviour (policy)

- Definitions:
  - runtime_schema_version: the schema version the running UI code supports (e.g., 1.0.0).
  - stored_schema_version: the schema version recorded on the persisted/in-progress form instance; found on form metadata schema_version.

- Behaviour options considered:
  A) Block resume: refuse to resume the form when major version mismatch; provide a clear message and require user to start a new form or call for migration.
  B) Migrate on resume: attempt automated migration if a documented migration path exists from stored_schema_version -> runtime_schema_version, then allow resume.
  C) Fallback degrade: allow resume but hide/lock fields that are unknown; record event and require final validation before submission.

- Selected default behaviour (for this project): combination of A + B.
  - For MAJOR version mismatches (major numbers differ): Block resume. The UI displays an explicit error explaining incompatibility and routes the user to either create a new form or request migration. Backend records SchemaResumeBlocked event.
  - For non-major mismatches (same major, different minor/patch): Attempt local migration automatically where a documented migration function is available. If migration succeeds, record SchemaMigrationApplied and allow resume. If no migration is available or migration fails, apply behaviour C (fallback degrade) and flag the form as needing manual review prior to final submission.

- How this is surfaced to users:
  - Blocked resume: user sees an inline banner with title "Form cannot be resumed: schema version mismatch" and a short explanation, plus an action "Request migration" which opens a support workflow or server-side job.
  - Automatic migration: short unobtrusive notification "Form automatically migrated to vX.Y.Z", with link to migration log.
  - Fallback degrade: UI warns that some fields have been locked/hidden and a clinician must review before final submit.

5. Backend recording requirements for schema-version events

- Event types (minimum):
  - SchemaMismatchDetected
  - SchemaResumeBlocked
  - SchemaMigrationApplied
  - SchemaMigrationFailed
  - SchemaResumeFallbackAllowed

- Required common payload fields for each event (stored in an append-only event table/stream):
  - event_type: string (one of the types above)
  - event_id: UUID
  - timestamp: ISO-8601
  - user_id: string | null (the acting user triggering the action; null for automated system jobs)
  - form_id: string
  - patient_id: string | null
  - runtime_schema_version: string
  - stored_schema_version: string
  - migration_action: string | null (e.g., "auto-migrate", "block", "fallback", "manual-review")
  - migration_details: object | null (opaque JSON with migration diffs, error messages, or audit notes)
  - correlation_id: string | null (request/session id to correlate with UI actions)

- Retention and PII guidance:
  - Events MUST NOT include full clinical content (e.g., full notes, doses) unless required. migration_details MAY include diffs or summaries for troubleshooting but must be redacted of PHI if it leaves the clinical datastore.
  - Event records are audit logs and must be retained according to the project's retention policy (e.g., 7 years for clinical audit) — consult compliance. If retention policy differs by environment (dev/staging/prod), redact or shorten retention in non-prod environments.

- Example event payloads:
  - SchemaMismatchDetected example:
    {
      "event_type": "SchemaMismatchDetected",
      "event_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "timestamp": "2026-09-16T09:00:00Z",
      "user_id": "nurse-5678",
      "form_id": "00000000-0000-4000-8000-000000000001",
      "patient_id": "patient-1234",
      "runtime_schema_version": "1.0.0",
      "stored_schema_version": "0.9.0",
      "migration_action": "block",
      "migration_details": { "reason": "major version change: 0.x -> 1.x" },
      "correlation_id": "req-aaaaaaaa"
    }

  - SchemaMigrationApplied example:
    {
      "event_type": "SchemaMigrationApplied",
      "event_id": "a3f5f5e8-1111-2222-3333-444444444444",
      "timestamp": "2026-09-16T09:05:00Z",
      "user_id": null,
      "form_id": "00000000-0000-4000-8000-000000000002",
      "patient_id": "patient-9999",
      "runtime_schema_version": "1.0.0",
      "stored_schema_version": "1.0.0",
      "migration_action": "auto-migrate",
      "migration_details": { "applied_transform": "add-field-access_type_other_detail", "notes": "defaulted access_type_other_detail to null" },
      "correlation_id": "job-migrate-1234"
    }

6. Resume / API interaction expectations (summary)

- The UI is expected to check stored_schema_version on load of any in-progress form and compare to its runtime_schema_version before allowing edits.
- The UI should call a backend endpoint (see API draft) which will perform a conservative validation and produce one of: OK (resume allowed), MIGRATED (migration applied, return migration summary), BLOCKED (cannot resume), FALLBACK (resume with limited fields locked), with structured payload and event emission.

7. Responsibilities / next steps

- Backend owners must implement event logging and the conservative resume API. See docs/api/hemodialysis_form_api_draft.md for the draft contract.
- Design and clinical stakeholders must review confirmation modal copy and required fields flagged as critical before deployment.
- TASK-004/TASK-005 owners will implement single-field APIs and persistence details; unresolved low-level concerns are annotated in the API draft.

Approvals and review notes

- REVIEW: A cross-functional review (design, clinical, backend) is required before finalizing automated migrations. Record approvals and meeting minutes here (placeholder):
  - 2026-09-16: Draft created, pending review with clinical lead and backend engineering. (TODO: capture attendees and approvals.)
