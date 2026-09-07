# EP-001 Security Requirements (OWASP-Aligned)

## 1) Document Purpose and Scope

This document defines definitive security and privacy requirements for **EP-001 / US-001** and provides testable acceptance checks in Given/When/Then form.

- **Primary reference standards:** OWASP ASVS v4.x, OWASP Top 10 (A01, A02, A03, A05, A08, A10)
- **Applies to:** intake-workshop outputs, requirements artifacts, and any supporting workflow services that store, process, or transmit EP-001 data
- **Authoritative security companion artifact for:** `docs/requirements/EP-001_draft_requirements.md`

---

## 2) Security Requirement SR-AC: Access Control and Authorization

### Requirement
1. Access to EP-001 workshop notes, decisions, and follow-up trackers must enforce least privilege and role-based authorization.
2. Roles must be explicitly mapped:
   - **PO role:** approve/reject requirements package, comment, request changes
   - **Delivery Lead role:** create/edit draft content, assign follow-up owners
   - **Compliance role:** review security/compliance content, approve/block sign-off
   - **Read-only stakeholder role:** view approved artifacts only
3. Unauthorized actions must fail safely with 403/401 and no sensitive detail in response body.

### Acceptance Checks (Given/When/Then)
- **AC-SR-AC-01 (positive):**
  - **Given** a user with Delivery Lead role and valid authentication
  - **When** the user updates a follow-up owner or due date
  - **Then** the update is accepted, persisted, and audit-logged with actor, timestamp, and change summary.

- **AC-SR-AC-02 (negative):**
  - **Given** an authenticated user with read-only stakeholder role
  - **When** the user attempts to modify decision-log content
  - **Then** the request is denied with 403, the artifact remains unchanged, and no stacktrace/internal policy detail is returned.

- **AC-SR-AC-03 (authn boundary):**
  - **Given** an unauthenticated request
  - **When** it attempts to access non-public EP-001 artifact endpoints
  - **Then** access is denied with 401 and no artifact data is disclosed.

---

## 3) Security Requirement SR-IV: Input Validation and Injection Prevention

### Requirement
1. All structured fields (IDs, owner names, statuses, dates, rationale text) must be validated server-side with allowlist rules, type constraints, and length limits.
2. Unsafe input must be rejected with controlled 4xx errors and sanitized error messages.
3. Queries and command invocations must use parameterized APIs and must never concatenate untrusted input.
4. Rendered content must be context-appropriate encoded/escaped to prevent stored/reflected XSS.

### Validation Rules (minimum)
- IDs: pattern `^[A-Z]-\d{3}$` or documented equivalent
- Status fields: enum allowlist (e.g., Pending, In Progress, Closed, Open)
- Dates: ISO-8601 format and valid calendar date
- Free-text rationale/notes: max length defined, control characters rejected

### Acceptance Checks (Given/When/Then)
- **AC-SR-IV-01 (valid input):**
  - **Given** a request payload where each field conforms to schema and allowlist rules
  - **When** the payload is submitted
  - **Then** the system accepts it and stores only validated values.

- **AC-SR-IV-02 (SQL injection):**
  - **Given** a payload containing SQL meta-characters (for example `"' OR 1=1 --"`) in a text field
  - **When** the payload is submitted
  - **Then** the request is rejected with 400/422, no unintended query execution occurs, and no database error detail is leaked.

- **AC-SR-IV-03 (command injection):**
  - **Given** input containing shell metacharacters (for example `"; cat /etc/passwd"`)
  - **When** processing attempts to use that input in command-sensitive logic
  - **Then** the request is rejected with 4xx and no command execution occurs.

- **AC-SR-IV-04 (XSS):**
  - **Given** input containing script or event-handler payloads (for example `<script>alert(1)</script>`)
  - **When** the value is stored and later rendered in UI/report output
  - **Then** script execution is prevented via output encoding/escaping and content is rendered as inert text.

- **AC-SR-IV-05 (safe failure):**
  - **Given** malformed JSON or type-invalid payload fields
  - **When** validation fails
  - **Then** the response is 400/422 with generic validation messages and no stacktrace, secrets, or internal paths.

---

## 4) Security Requirement SR-CR: Cryptographic Handling

### Requirement
1. Data in transit must use TLS 1.2+ (TLS 1.3 preferred) with weak protocol/cipher suites disabled.
2. Sensitive data at rest (including files or database rows containing restricted/confidential fields) must be encrypted using approved algorithms (AES-256 or organization-approved equivalent).
3. Keys must be managed by approved KMS/secret-management services; keys must not be hardcoded in repository artifacts.
4. Integrity of security-significant audit records must be protected against tampering.

### Acceptance Checks (Given/When/Then)
- **AC-SR-CR-01 (transport security):**
  - **Given** a client attempts plaintext HTTP to a protected endpoint
  - **When** the connection is established
  - **Then** plaintext access is refused or redirected to HTTPS, and only TLS 1.2+ is permitted.

- **AC-SR-CR-02 (at-rest encryption):**
  - **Given** a stored record containing restricted/confidential fields
  - **When** storage encryption controls are inspected
  - **Then** those fields are encrypted at rest with approved algorithm/policy configuration.

- **AC-SR-CR-03 (key management):**
  - **Given** deployment/runtime configuration is reviewed
  - **When** encryption keys are traced
  - **Then** keys originate from approved key management, are rotation-capable, and are absent from source-controlled plaintext.

- **AC-SR-CR-04 (error handling):**
  - **Given** a cryptographic operation fails
  - **When** the system returns an error
  - **Then** it returns a controlled failure response without exposing key material, algorithm internals, or stacktrace data.

---

## 5) Security Requirement SR-SSRF: Outbound Request and SSRF Controls

### Requirement
1. Outbound HTTP(S) requests must use strict allowlisting of approved destinations.
2. Destination validation must block private/internal IP ranges, loopback, link-local, metadata endpoints, and non-approved schemes.
3. DNS resolution must be validated to prevent rebinding bypass.
4. Network egress controls must enforce the same destination policy at infrastructure boundary.

### Acceptance Checks (Given/When/Then)
- **AC-SR-SSRF-01 (allowlisted destination):**
  - **Given** an outbound request target that matches the approved destination allowlist
  - **When** the request is initiated
  - **Then** the request is allowed and logged with destination metadata.

- **AC-SR-SSRF-02 (blocked internal target):**
  - **Given** an outbound URL resolving to internal/private/loopback space (e.g., `127.0.0.1`, `10.0.0.0/8`, or cloud metadata endpoint)
  - **When** the request is initiated
  - **Then** the request is blocked with a controlled error and security event logging.

- **AC-SR-SSRF-03 (blocked scheme/port):**
  - **Given** a URL using a non-approved scheme or port
  - **When** validation executes
  - **Then** the request is rejected before network call-out.

- **AC-SR-SSRF-04 (DNS rebinding resistance):**
  - **Given** a hostname that initially appears public but resolves to disallowed/internal address during validation
  - **When** outbound validation is applied
  - **Then** the request is denied and flagged for security review.

---

## 6) Data Classification, Privacy, Retention, and Minimization

### Data Classification Matrix

| Data Element | Classification | Privacy/Security Handling | Retention |
|---|---|---|---|
| Requirement IDs, decision IDs, status enums | Internal | Integrity controls and authenticated access | Project lifecycle + 1 year |
| Owner names/assignees (work contact data) | Confidential (PII-light) | Least privilege, masking in broad reports/logs where not needed | Project lifecycle + 1 year |
| Decision rationale and workshop notes | Confidential | Access control, encryption at rest, approved sharing channels only | Project lifecycle + 2 years |
| Compliance comments and sign-off outcomes | Restricted | Need-to-know access, audit trail required, encrypted storage/transport | Project lifecycle + 3 years |
| System audit logs for changes/access | Restricted | Tamper-evident logging, security monitoring access only | Per org log policy (minimum 1 year) |

### Privacy and Minimization Requirements
1. Collect only data needed for decision traceability and sign-off.
2. Do not store sensitive credentials, secrets, or unnecessary personal data in requirement artifacts.
3. Redact or omit personal identifiers from exported summaries unless explicitly required.
4. Log access and edits to confidential/restricted sections for accountability.

### Acceptance Checks (Given/When/Then)
- **AC-DP-01 (minimization):**
  - **Given** an intake template field not required for EP-001 outcomes
  - **When** artifact data is captured
  - **Then** that field is not collected or is removed before finalization.

- **AC-DP-02 (retention):**
  - **Given** a document exceeds its retention threshold
  - **When** retention review executes
  - **Then** it is archived/deleted per policy with auditable record.

- **AC-DP-03 (privacy-safe errors/logs):**
  - **Given** invalid/malicious input is submitted
  - **When** the system rejects it
  - **Then** logs and responses omit raw secrets/sensitive personal data while preserving forensic usefulness.

---

## 7) Traceability to Sign-Off Governance

Formal approval gates, required approvers, decision thresholds, and escalation timelines are defined in:

- `docs/compliance/EP-001_security_signoff.md`
