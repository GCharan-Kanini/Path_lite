Allowed-Null UI Pattern and Semantics

Purpose

This document is the project-wide authoritative specification for the "allowed-null" semantic: the nurse-facing UI control pattern, the confirmation flow and the audit / telemetry artifacts required when a clinician intentionally records a missing or intentionally omitted value.

Scope

- Applies to clinician-facing guided forms and session-based clinical intake flows where field-level schema permits an explicit allowed-null choice.
- Defines semantics distinct from an empty string, null-by-omission, or skipped slots.
- Specifies nurse-facing control patterns, confirmation copy, ARIA and keyboard behaviours, audit-log shape, minimium telemetry, and confirmation-summary layout rules.

Key definitions

- allowed-null: an explicit, auditable clinician action that records that the clinician affirms the absence of a value for a schema field. This is not the same as leaving a field empty or skipping a question; it is a recorded, acknowledged decision.
- allowed-null-permitted: a field-level schema annotation (x-allowed-null: true) that enables presentation of the allowed-null control.
- allowed-null-reason-required: a field-level schema annotation (x-allowed-null-reason-required: true) that forces the confirmation modal to capture a reason_code or free-text reason when allowed-null is chosen.

Semantics and invariants

- Allowed-null MAY be presented to the nurse only when the field schema contains x-allowed-null: true. Presentation must be conditional; do not surface for fields without this annotation.
- Recording allowed-null MUST require an explicit nurse confirmation via the confirmation flow described below. A passive selection or implicit omission is not sufficient.
- For fields marked as REQUIRED_CRITICAL by policy, allowed-null should be disabled by default unless a higher-level policy permits it. If enabled it MUST require reason capture and may require escalation.
- Recording allowed-null sets the session-level slot metadata:
  - value_tag = "allowed_null"
  - resolved_value = null
  - allowed_null_recorded_by = <user_id>
  - allowed_null_recorded_at = <ISO-8601 timestamp>
  - allowed_null_reason_code (optional) or allowed_null_reason_text (if configured)
  - clarification_attempts_count (number)

Nurse-facing control pattern

- Visual affordance:
  - Placement: inline with the field input, aligned to the right side of the input control row for desktop; stacked beneath the field on narrow screens.
  - Control: a tertiary button with label: "Prefer not to answer" and an explicit icon (open circle with a dash) that visually distinguishes it from destructive actions.
  - Accessibility: Use role="button" and aria-pressed="false" initially. Provide aria-describedby pointing to contextual help text: "Selecting this records that you intentionally omitted a value; confirmation will be required.".
  - Keyboard: control focusable in tab order after the field input. Activation via Enter/Space triggers confirmation modal.

- Inline hints:
  - When shown, provide contextual help link or tooltip that explains why allowed-null exists and links to policy.

Confirmation modal

- Trigger: activation of the inline "Prefer not to answer" control opens a modal dialog (role="dialog") that traps focus and is dismissible with Escape.
- Title copy: "Confirm: record as intentionally omitted"
- Body copy (first-line): "Are you sure you want to record no value for [field_label]? This will be recorded in the audit log."
- Required fields in modal (driven by field metadata):
  - If x-allowed-null-reason-required: show a reason chooser (radio or select) with a list of allowed reason_codes and a conditional free-text field for 'other'. Make the reason required.
  - Else: show optional free-text reason (placeholder: "Optional: brief reason or context") with max length 1024 chars.
- Primary action: "Confirm and record" (aria-label="Confirm record as intentionally omitted for [field_label]")
- Secondary action: "Cancel" (closes modal, returns to form)
- On confirm: close modal, set slot metadata and emit AllowedNullRecorded and ClarificationResponseCaptured telemetry events.

Confirmation flow (sequence)

1. Nurse activates allowed-null control for field F.
2. Show confirmation modal with reason input as required by schema metadata.
3. Nurse confirms (or cancels).
4. On confirm: update session state atomically with value_tag='allowed_null' and required audit fields, increment clarification_attempts_count (if applicable), persist to session store, and emit telemetry events:
   - AllowedNullPromptIssued (session_id, correlation_id, field_key, timestamp)
   - AllowedNullRecorded (session_id, correlation_id, field_key, nurse_user_id, allowed_null=true, reason_code?, reason_text_present(bool), clarification_attempts_count, timestamp)
   - ClarificationResponseCaptured (same minimal non-PII payload shape as other clarification events)
5. Confirmation summary and UI should reflect the allowed-null choice using the notation described below.

Audit-log entry schema example

- Stored audit record (server-side, may contain plaintext per compliance rules; telemetry must NOT contain plaintext):
  {
    "audit_id": "uuid",
    "session_id": "...",
    "correlation_id": "...",
    "field_key": "blood_flow_rate_ml_per_min",
    "previous_value": 350,             // nullable, may be null
    "resolved_value": null,
    "allowed_null": true,
    "allowed_null_reason_code": "not_available", // optional
    "allowed_null_reason_text": "Patient refused to provide",
    "nurse_user_id": "nurse-5678",
    "clarification_attempts_count": 2,
    "timestamp": "2026-09-01T08:35:00Z",
    "audit_store_path": "audit/2026/09/01/.."
  }

- Telemetry event (NO PII or plaintext values):
  {
    "event": "AllowedNullRecorded",
    "session_id": "...",
    "correlation_id": "...",
    "field_key": "blood_flow_rate_ml_per_min",
    "allowed_null": true,
    "reason_code_present": true,
    "clarification_attempts_count": 2,
    "nurse_user_id_hash": "hmac:...",
    "timestamp": "2026-09-01T08:35:00Z"
  }

Confirmation-summary field set and layout rules

- Ordering and grouping:
  - Group fields by form section and then by criticality: REQUIRED_CRITICAL first, then REQUIRED_NONCRITICAL, then OPTIONAL.
  - Within a section, preserve input order from the form.
- Representation of allowed-null values:
  - Display label: [field_label]
  - Display value: "<Intentionally omitted>" followed by the short reason if available (e.g. "(Patient declined)")
  - Display a small badge: "Recorded as omitted" with tooltip linking to audit record id and timestamp.
  - If a field was masked earlier (sensitive/P HI), show masked placeholder like "••••" but append "+ omitted" when allowed-null is recorded (example: "•••• + omitted").
- Masking rules:
  - Sensitive values remain masked in the confirmation summary. If allowed-null was recorded for a sensitive value, present the masked placeholder plus the omitted badge; never unmask in telemetry or summary without explicit permission.
- Idempotency and undo:
  - Confirmation summary must allow an undo action that re-opens the field for editing and adds an audit entry: { action: 'undo_allowed_null', replaced_by: <edited_value>, previous_allowed_null_audit_id }

Examples

- Before: blood_flow_rate_ml_per_min: 350
- Nurse selects "Prefer not to answer" -> confirms with reason "Patient refused"
- After (confirmation summary):
  - blood flow rate: <Intentionally omitted> (Patient refused) [Recorded as omitted]
  - audit id: 3c3e... (link)

Implementation notes for front-end and back-end

- Frontend must:
  - Only show allowed-null control when field metadata x-allowed-null: true.
  - Respect x-allowed-null-reason-required to make reason mandatory in the confirmation modal.
  - Emit non-PII telemetry events with correlation_id and session_id.
  - Update session payload with the allowed-null metadata fields in a single atomic PATCH.
- Backend must:
  - Accept and validate allowed-null payloads; persist audit entries and return audit_id.
  - Ensure telemetry events contain no plaintext PII; use hashing/HMAC for identifiers if needed.
  - Enforce role-based gating for REQUIRED_CRITICAL allowed-null recording if configured.

Telemetry and events (minimum)

- AllowedNullPromptIssued
- AllowedNullRecorded
- ClarificationResponseCaptured
- ConfirmationSummaryEmitted (summary_state_hash includes allowed-null markers)

Testing checklist

- Verify allowed-null control invisible for fields without x-allowed-null.
- Verify confirmation modal enforces reason when x-allowed-null-reason-required is true.
- Verify audit entry persisted and audit_id surfaced to confirmation summary.
- Verify telemetry contains no plaintext PII for allowed-null events.

Deferred ambiguities

- Role constraints for REQUIRED_CRITICAL allowed-null (nurse vs physician) and escalation policy.
- Canonical reason_code set: taxonomy vs free-text and mandated mapping for analytics.
- Whether allowed-null selection for a given field should immediately trigger EscalationRequested in some workflows.

References

- docs/requirements/ambiguity_thresholds_clarification_guidelines.md
- docs/design/schemas/hemodialysis_add_new.schema.json
