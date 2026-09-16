Ambiguity Thresholds and Clarification Guidelines

Purpose

This authoritative design deliverable defines numeric and semantic ambiguity thresholds and operational clarification guidelines for clinical interaction flows. It is intended for UI, backend, and AI implementers and provides concrete, testable acceptance checks that map to US-003 acceptance criteria.

Scope

- Applies to conversational clinical intake interactions where the assistant collects structured schema slots from users (voice or typed).
- Covers: numeric and semantic ambiguity thresholds; first-retry and subsequent-retry clarification phrasing templates; retry limits; escalation triggers and behaviours; ASR/NLP borderline handling rules; required telemetry, audit points, session-state mapping and confirmation-summary representation.
- Does not prescribe final UI copy or clinician-facing policy decisions; those are to be reviewed by clinical SMEs.

Summary of Key, Explicit Numeric Thresholds

- ASR confidence thresholds (0.0 - 1.0 scale):
  - HIGH_CONFIDENCE >= 0.85: accept input without clarification
  - BORDERLINE_AUTO_CLARIFY 0.70 <= c < 0.85: accept candidate value but mark as "candidate" and run soft-clarification (single targeted probe) depending on slot criticality
  - AMBIGUOUS_CLARIFY c < 0.70: require interactive clarification
  - NO_INPUT or NO_RECOGNIZED_TOKENS: treat as timeout/no-response flow

- NLP semantic intent/slot confidence (0.0 - 1.0 scale):
  - HIGH_NLP_CONFIDENCE >= 0.80: accept mapped slot value
  - BORDERLINE_NLP 0.60 <= c < 0.80: attempt targeted clarification if slot criticality is HIGH; else accept with 'candidate' flag
  - AMBIGUOUS_NLP c < 0.60: clarification required

- Retry limits (per-slot):
  - FIRST_RETRY: 1 clarification attempt (the assistant issues first-retry phrasing)
  - SUBSEQUENT_RETRIES: up to 2 additional attempts (total attempts including initial ask = 3)
  - GLOBAL_SESSION_RETRY_LIMIT: 8 clarification attempts across all slots in a 10-minute window; after this escalate to human-review

- Timeouts and no-response handling:
  - VOICE_PROMPT_RESPONSE_TIMEOUT: 6 seconds of silence to consider as no-response for standard prompts
  - CONFIRMATION_RESPONSE_TIMEOUT: 12 seconds when awaiting explicit confirmation
  - INTERACTION_INACTIVITY_TIMEOUT: 120 seconds of no activity in a session before auto-save and escalation option presented

- ASR/NLU combined decision heuristic:
  - If ASR_confidence < 0.70 OR NLP_confidence < 0.60 => require clarification
  - If ASR_confidence in [0.70, 0.85) AND NLP_confidence >= 0.80 => accept with candidate flag
  - For multi-slot ambiguity where more than 2 slots are ambiguous in same turn => escalate after configured attempt limits

Slot criticality model (semantic thresholds)

- Each schema slot is assigned a criticality label: REQUIRED_CRITICAL, REQUIRED_NONCRITICAL, OPTIONAL.
- Mapping to behaviour:
  - REQUIRED_CRITICAL: Clarification mandatory if confidence < HIGH thresholds; do not offer allowed-null unless explicit clinical policy permits and user or clinician confirms.
  - REQUIRED_NONCRITICAL: Allow candidate accept with post-hoc confirmation or present allowed-null option if configured.
  - OPTIONAL: If ambiguous, accept null or suggest skipping; track as allowed-null if chosen.

Clarification Targeting Rules

- Clarifications must target only ambiguous schema slots: a slot is "ambiguous" when the slot's resolved_value is marked as candidate or confidence below clear threshold.
- When crafting clarification prompts, assistant must include expected data type and constraints. Example: "I heard: 'three days'. For the duration of symptoms, do you mean 3 days (yes/no)?"
- Multi-slot clarifications must avoid shotgun questions. If multiple ambiguous slots exist, clarify the highest-criticality slot first, then re-evaluate.
- Machine-readable targeting rule (implementer-friendly):
  - For each slot S in session.pending_slots: if S.confidence < threshold(S.criticality) OR S.value_tag == 'candidate' => S.is_ambiguous = true
  - Clarification queue = sort(pending_slots where is_ambiguous == true) by criticality desc, dependency_score desc

Clarification phrasing templates

- Voice first-retry (explicit expected type):
  - "Sorry, I didn't catch that. For the [slot_label], did you say [candidate_text]? Please say yes to confirm or tell me the correct [slot_type]."
- Voice subsequent-retry (shorter, with escalation hint):
  - "I still didn't get the [slot_label]. You can say it again, or I can connect you to a clinician. What would you prefer?"
- Typed (chat) first-retry:
  - "I didn't understand the [slot_label]. Did you mean '[candidate_text]' (yes/no), or please type the correct [slot_type]."
- Typed subsequent-retry:
  - "I still can't resolve the [slot_label]. You can re-type the answer, or choose 'I don't know' to skip."
- Allowed-null offering phrasing (only when policy permits):
  - "If you don't know, you can select 'Prefer not to answer' and we'll proceed. Are you okay with that?"

- Phrasing rules:
  - Always include slot label and expected data type (date, number, medication name, duration, symptom description length-bound).
  - Keep first retry explicit, subsequent retries concise and include escalation choice.
  - Do not propose medical advice or diagnosis in clarifications; confine to data collection.

Escalation triggers and behaviours

- Immediate escalation to human (call or chat handoff) if ANY of the following:
  - A REQUIRED_CRITICAL slot remains ambiguous after 3 attempts
  - GLOBAL_SESSION_RETRY_LIMIT exceeded
  - User explicitly requests human assistance during a retry prompt
  - More than 2 distinct REQUIRED_CRITICAL slots ambiguous simultaneously and attempts > 1
  - Session inactivity timeout and unresolved critical slots

- Escalation actions:
  - Offer immediate in-session human contact (if available) or schedule callback; record EscalationRequested telemetry event
  - Persist session state with ambiguous flags and candidate values
  - Emit an audit entry flagged for priority human review with correlation id and non-PII descriptive context

ASR / NLP borderline-ambiguity handling rules

- Borderline cases combine ASR and NLP confidences and slot criticality to choose behaviour:
  - If ASR_confidence in BORDERLINE_AUTO_CLARIFY range and slot is REQUIRED_NONCRITICAL: accept value, mark as candidate, emit CandidateValueRecorded telemetry; queue soft-confirm later during confirmation summary
  - If ASR_confidence in BORDERLINE range and slot REQUIRED_CRITICAL: prompt for clarification immediately
- For homophone-prone slots (e.g., medication names), prefer typed confirmation or spell-back when ASR confidence < 0.85 even if NLP confidence is high
- For multi-token or free-text slots (symptom description), use a summary-back confirmation instead of over-specific slot-level probing

Session state and confirmation summary mapping

- Session state fields to record for each slot:
  - slot_id
  - slot_label
  - resolved_value
  - raw_input (redacted for PII in telemetry; stored encrypted in session storage)
  - asr_confidence (nullable)
  - nlp_confidence (nullable)
  - value_tag: {accepted, candidate, ambiguous, allowed_null, skipped}
  - clarification_attempts: integer
  - last_clarification_ts
  - clarified_by: {assistant, user, human_operator}

- Confirmation summary entries:
  - For each slot recorded: slot_label, displayed_value (resolved_value unless value_tag==candidate then show '(candidate)'), value_tag indicator, if clarified show brief note: 'clarified by assistant at HH:MM'
  - For allowed-null choices: show 'User chose: Prefer not to answer' and link to policy reason code (if required)

Telemetry and audit points (required)

- Event names and required payload attributes (PII rules called out):
  - ClarificationPromptIssued
    - session_id, correlation_id, slot_id, slot_label, prompt_type (first_retry|subsequent_retry|soft_confirm), channel (voice|typed), timestamp
    - do NOT include raw_input or any PII values
  - ClarificationResponseCaptured
    - session_id, correlation_id, slot_id, slot_label, value_tag, asr_confidence, nlp_confidence, parsed_value_type, timestamp
    - raw_input must NOT be emitted; only redacted hint tokens if policy allows
  - CandidateValueRecorded
    - session_id, correlation_id, slot_id, resolved_value_hash (opaque), value_tag='candidate', asr_confidence, nlp_confidence, timestamp
    - resolved_value_hash is a deterministic HMAC of the value using server-side key - no plaintext in logs
  - ClarificationAttemptLimitReached
    - session_id, correlation_id, slot_id, attempts, escalation_reason, timestamp
  - EscalationRequested
    - session_id, correlation_id, slot_ids_affected, escalation_type (human_immediate|callback|review_queue), timestamp
  - TimeoutNoResponse
    - session_id, correlation_id, prompt_type, timeout_seconds, timestamp
  - ConfirmationSummaryEmitted
    - session_id, correlation_id, summary_state_hash, list_of_slot_ids, timestamp

- Telemetry payload rules
  - Never emit unredacted PII values in telemetry or audit logs. Use resolvers: resolved_value_hash, value_type, and non-identifying metadata.
  - Correlation ids: every event must include a correlation_id that maps to session_id and interaction turn id. Backend must be able to rehydrate session state for human review.
  - Audit logs for compliance must persist limited plaintext where required, secured, and access-controlled; audit-only storage must be separate and encrypted with stricter KMS policies.

PII handling and data retention

- Raw_input and resolved_value plaintext may be stored in session storage only when necessary; they must be encrypted at rest and access-limited.
- Telemetry must never contain plaintext PII. Use HMAC/hash placeholders in emitted telemetry.
- Retention policy: ambiguous-resolution telemetry and audit trails retained for 365 days by default; allow configuration per compliance needs.

Implementation notes for engineers (hooks and middleware)

- Frontend:
  - useRetryWithBackoff.js should emit ClarificationPromptIssued and TimeoutNoResponse events and be able to accept per-slot retry limits; add per-slot attempt counter wiring into session payloads
  - VerticalSliceForm.jsx should present allowed-null controls when slot.criticality permits, and show candidate statuses in the confirmation summary UI
- Backend:
  - idempotencyMiddleware should persist clarification_attempts and last_clarification_ts so retries are safe across retries and reconnects
  - verticalSliceService should surface APIs to record ClarificationResponseCaptured and update slot.value_tag atomically
  - Provide endpoints to request escalation: POST /sessions/:id/escalate with payload { slot_ids, reason }

- Gaps to address (recommended changes):
  - useRetryWithBackoff currently supports exponential backoff for network retries; extend it to accept slot-level retry metadata and emit ClarificationPromptIssued telemetry
  - idempotencyMiddleware should be enhanced to track clarification_attempts and to prevent duplicate increments on replays
  - apiClient.js should support session-level correlation_id and attach to all telemetry events

Acceptance checks and testable statements (map to US-003)

- AC: Clarification targets only ambiguous data slots and includes expected data type
  - Test: Create a session with two slots: one ambiguous (nlp_confidence=0.55) and one clear (nlp_confidence=0.95). On assistant turn, verify emitted ClarificationPromptIssued only for ambiguous slot and UI prompt includes slot_type. Telemetry should show slot_id list of one.

- AC: Retry attempts and escalation behaviour follow configured limits
  - Test: Simulate repeated ambiguous responses for a REQUIRED_CRITICAL slot; after 3 attempts the assistant should emit ClarificationAttemptLimitReached and EscalationRequested. Verify escalation_type and that session state shows clarified_by='assistant' and attempts=3.

- AC: No-response or timeout handling
  - Test: On no speech detected for VOICE_PROMPT_RESPONSE_TIMEOUT, assistant should emit TimeoutNoResponse and present allowed-null if configured. If user selects allowed-null, audit log should contain allowed-null choice with policy code and session state updated value_tag='allowed_null'.

- AC: Assistant interactions recorded and reflected in session state and confirmation summary
  - Test: After clarification flow, check that confirmation summary includes '(candidate)' marker for candidate values and shows clarification timestamps. Verify ConfirmationSummaryEmitted event includes list_of_slot_ids and summary_state_hash.

Integration checklist for implementers

- Frontend:
  - [ ] Present first-retry and subsequent-retry prompts per templates
  - [ ] Implement allowed-null control, hidden unless slot policy permits
  - [ ] Show candidate markers in confirmation summary
  - [ ] Emit ClarificationPromptIssued and ConfirmationSummaryEmitted events with correlation ids

- Backend:
  - [ ] Persist slot-level fields in session store with encryption for raw_input
  - [ ] Add ClarificationAttemptLimitReached handler and EscalationRequested flow
  - [ ] Ensure idempotent updates of clarification_attempts
  - [ ] Provide secure audit storage for plaintext when required by compliance

- AI/Model integration:
  - [ ] Map ASR confidence and NLP confidences into thresholds above before accepting or clarifying
  - [ ] Implement candidate tagging when borderline confidences
  - [ ] For medication and critical protected slots, prefer spell-back or typed confirmation when ASR_confidence < 0.85

Sample test scenarios and expected telemetry traces

1) Single ambiguous slot clarified successfully on first retry
  - Inputs: slot.temperature nlp_confidence=0.58, criticality=REQUIRED_NONCRITICAL
  - Expected events: ClarificationPromptIssued -> ClarificationResponseCaptured (value_tag=accepted, nlp_confidence updated) -> ConfirmationSummaryEmitted

2) Critical slot fails three clarifications and escalates
  - Inputs: slot.allergy nlp_confidence repeatedly <0.60, attempts exceed 3
  - Expected events: ClarificationPromptIssued x3 -> ClarificationAttemptLimitReached -> EscalationRequested

3) ASR borderline auto-accept candidate
  - Inputs: ASR_conf=0.75, NLP_conf=0.82, slot=REQUIRED_NONCRITICAL
  - Expected: CandidateValueRecorded (value_tag=candidate) -> ConfirmationSummaryEmitted shows '(candidate)'

Clinical SME and stakeholder review plan

- Deliver initial draft for clinical SME and platform owner review
- Collect written feedback within 10 business days
- Triage feedback into policy vs implementation items
- Publish follow-up revision with updated thresholds and phrasing

Document maintenance

- Owner: Product Owner EP-001
- Review cadence: quarterly or on material change to ASR/NLP components
- Change control: any change to numeric threshold requires SME sign-off and test-suite update

Appendix: Quick reference table (numeric values)

- ASR accept threshold: 0.85
- ASR borderline auto-clarify: [0.70, 0.85)
- ASR clarify threshold: <0.70
- NLP accept threshold: 0.80
- NLP borderline: [0.60, 0.80)
- NLP clarify threshold: <0.60
- Slot per-slot retry limit: 3 attempts total
- Global session retry limit: 8 attempts per 10 minutes
- Voice response timeout: 6s
- Confirmation timeout: 12s
- Inactivity escalation: 120s

End of document
