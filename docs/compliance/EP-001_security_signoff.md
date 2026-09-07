# EP-001 Security/Compliance Sign-Off Checklist

## 1) Purpose

This checklist defines required approvers, sign-off criteria, decision thresholds, and escalation path for EP-001 security/compliance readiness.

- **Capability:** EP-001 / US-001
- **Companion artifacts:**
  - `docs/requirements/EP-001_draft_requirements.md`
  - `docs/requirements/EP-001_security_requirements.md`

---

## 2) Required Approvers and Responsibilities

| Role | Required for Approval? | Responsibility | Contact Point |
|---|---|---|---|
| Product Owner (PO) | Yes | Business acceptance, scope confirmation, unresolved trade-off decisions | PO - EP-001 mailbox/channel |
| Security Lead / AppSec Reviewer | Yes | Validate OWASP-aligned controls and acceptance checks | AppSec on-call channel |
| Compliance Representative | Yes | Validate policy/privacy/retention obligations | Compliance governance channel |
| Engineering Lead | Yes | Confirm technical feasibility and implementation constraints | Engineering leads channel |
| Delivery Lead | Yes | Validate traceability completeness and follow-up ownership | Delivery management channel |

> Sign-off is **blocked** if any required approver withholds approval.

---

## 3) Sign-Off Checklist Criteria

All criteria below must be satisfied before status can move to Approved:

1. Definitive Given/When/Then acceptance criteria are present in EP-001 draft requirements.
2. Security requirements artifact exists and covers access control, input validation/injection prevention, cryptographic handling, and SSRF controls with testable checks.
3. Data classification, privacy handling, minimization, and retention requirements are documented.
4. Decision log includes open/closed decisions, owners, due dates, and resolution path.
5. Follow-up tracker includes accountable owner and target date for each open item.
6. No unresolved High/Critical security/compliance blockers remain.
7. PO review state is explicit (Approved or Changes Requested).

### Evidence Required

- Current versions of the three EP-001 documents
- Review comments/approvals recorded by each required approver
- Open-risk register excerpt (if any) with owners and due dates
- Confirmation of escalation actions for blocked decisions (if invoked)

---

## 4) Decision Thresholds

| Outcome | Criteria |
|---|---|
| **Approved** | All required approvers approve and all checklist criteria pass. |
| **Conditionally Approved** | No High/Critical blockers; only Low/Medium items remain with documented owners and due dates accepted by PO + Security + Compliance. |
| **Blocked** | Any required approver rejects, or any High/Critical issue remains unresolved, or mandatory evidence is missing. |

---

## 5) Escalation Path (Blocked Sign-Off)

### Trigger Conditions
- Blocked status persists beyond agreed review window.
- Required approver unavailable and no delegate assigned.
- Dispute on risk acceptance for High/Critical findings.

### Escalation Workflow and Maximum Timeframes

| Escalation Level | Trigger | Escalate To | SLA / Maximum Timeframe |
|---|---|---|---|
| Level 1 | Initial block not resolved in working session | Delivery Lead + Engineering Lead + Security Lead | Within 1 business day |
| Level 2 | Level 1 unresolved or risk acceptance dispute | Product Director + Head of Security/Compliance | Within 2 business days from Level 1 |
| Level 3 | Level 2 unresolved; delivery impact imminent | Executive Sponsor / Governance Board | Within 3 business days from Level 2 |

### Escalation Records
For each escalation, record:
- date/time raised
- blocker summary and risk level
- participants and decision owner
- decision outcome and follow-up due date

---

## 6) Sign-Off Register (Template)

| Reviewer Role | Reviewer Name | Decision (Approve / Conditional / Block) | Date | Notes / Conditions |
|---|---|---|---|---|
| Product Owner | TBD | Pending | TBD |  |
| Security Lead | TBD | Pending | TBD |  |
| Compliance Representative | TBD | Pending | TBD |  |
| Engineering Lead | TBD | Pending | TBD |  |
| Delivery Lead | TBD | Pending | TBD |  |

---

## 7) Current Status

- **Status:** Pending formal sign-off
- **Open blocker count:** To be confirmed during review cycle
- **Next checkpoint:** Security/Compliance review session
