# Intake Workshop Facilitation Plan

## 1) Workshop Overview

This facilitation plan enables the product owner and implementation team to run an intake workshop end-to-end with clear preparation, execution, and follow-up steps.

- **Workshop name:** Product Intake Workshop
- **Facilitator:** Delivery Lead / Business Analyst
- **Product Owner (PO):** Accountable approver for scope and decisions
- **Audience:** Core delivery participants and stakeholder representatives
- **Target duration:** 120 minutes
- **Distribution requirement:** Send invitation and pre-reads at least **3 business days** before the workshop.

## 2) Objectives and Expected Outcomes

### Objectives
1. Align on business context, scope, constraints, and success criteria.
2. Confirm in-scope vs out-of-scope items.
3. Capture key implementation and governance decisions.
4. Identify owners and due dates for unresolved items.

### Expected outputs
- Agreed problem statement and capability scope.
- Prioritized list of requirements and assumptions.
- Decision log entries with rationale and ownership.
- Open questions list with follow-up owners and deadlines.

## 3) Attendees, Roles, and Responsibilities

| Role | Required | Responsibilities During Workshop | Artifact Capture Responsibility |
|---|---|---|---|
| Product Owner | Yes | Clarify business goals, approve scope boundaries, make priority calls | Final approval notes and sign-off window owner |
| Engineering Lead | Yes | Validate technical feasibility, dependencies, and constraints | Technical constraints and dependency capture |
| Delivery Lead / Facilitator | Yes | Keep agenda on time, run prompts and breakouts, resolve process blockers | Master notes quality and completeness |
| Security/Compliance Representative | Recommended | Validate security/compliance obligations | Security/compliance decisions and actions |
| UX/Design Representative | Optional | Confirm user flows and usability constraints | UX assumptions and research follow-ups |
| Scribe | Yes | Record decisions, actions, and unresolved items in real time | Decision log and action tracker upkeep |

## 4) Pre-Workshop Preparation Timeline

| Time | Activity | Owner |
|---|---|---|
| T-7 business days | Draft facilitation plan and agenda | Facilitator |
| T-5 business days | Product owner review meeting and updates | Facilitator + PO |
| T-3 business days | Distribute invitation + pre-reads to attendees | Facilitator |
| T-2 business days | Confirm RSVP, delegates, and tool access | Facilitator + Scribe |
| T-1 business day | Final readiness check and dry run | Facilitator + Engineering Lead |

## 5) Materials and Pre-Read Checklist

Use this checklist before distribution:

- [ ] Current product/problem context brief (1–2 pages)
- [ ] Existing requirement artifacts and architecture references
- [ ] Known constraints (timeline, budget, policy, compliance)
- [ ] Access to collaboration tools (whiteboard, shared doc, call link)
- [ ] Demo/test accounts and required data access permissions
- [ ] Decision log template prepared and accessible
- [ ] Invitation email drafted using template
- [ ] Recording permissions confirmed (if recording is enabled)
- [ ] Product owner has reviewed and approved the package

## 6) Time-Boxed Agenda (120 Minutes)

| Timebox | Topic | Facilitator Prompts | Owner | Artifact Capture |
|---|---|---|---|---|
| 10 minutes | Introductions and workshop purpose | "What outcome must be true by end of session?" | Facilitator | Attendance and objective alignment |
| 15 minutes | Business context and success criteria | "Which measurable outcomes define success?" | Product Owner | Success criteria list |
| 20 minutes | Scope framing (in/out) | "What is explicitly in scope today? What is not?" | PO + Eng Lead | In-scope/out-of-scope table |
| 20 minutes | Capability and requirement discussion | "What capabilities are mandatory for first release?" | Team | Draft requirement set |
| 20 minutes | Constraints and dependencies | "What blocks delivery if unresolved?" | Eng Lead + Stakeholders | Constraint/dependency log |
| 20 minutes | Decision points and trade-offs | "What decision is needed now vs later?" | PO + Leads | Decision log entries |
| 10 minutes | Risk review and contingencies | "Who is backup decision-maker if key role is absent?" | Facilitator | Risk + contingency notes |
| 5 minutes | Summary, actions, and sign-off window | "Who owns each follow-up and by when?" | Facilitator + Scribe | Action register and sign-off plan |

## 7) One-Page Facilitator Script

### Opening (0–10 min)
- Confirm objective, outcomes, and meeting norms.
- Confirm scribe and artifact capture locations.
- State decision policy: unresolved issues become tracked follow-ups with owners.

### Context + Success Criteria (10–25 min)
- Prompt PO for business objective statement.
- Ask team to restate success criteria in measurable terms.
- Record accepted success criteria in workshop notes.

### Scope and Capability Breakout (25–65 min)
- Run a structured discussion or breakout:
  - Group A: In-scope requirements.
  - Group B: Out-of-scope and assumptions.
- Reconvene and merge outputs.
- Validate conflicts and decision needs.

### Constraints, Dependencies, and Decisions (65–105 min)
- Review technical, compliance, operational constraints.
- For each decision:
  - Decision statement
  - Rationale
  - Owner
  - Due date / follow-up
- Ensure scribe records each item in decision log template.

### Close (105–120 min)
- Read back key decisions and open questions.
- Confirm sign-off window and escalation contacts.
- Confirm post-workshop consolidation timeline.

## 8) Stakeholder Contingency and Escalation Guidance

If a key stakeholder is absent, unavailable, or missing:

1. **Delegate handling:** Require a named delegate/proxy with decision authority before workshop start.
2. **Asynchronous capture:** Collect absent stakeholder input via asynchronous written response (shared doc or email) within 24 hours.
3. **Provisional decisions:** Mark decisions as provisional if absent role approval is required.
4. **Sign-off window:** Provide a **2 business day sign-off window** for absent stakeholders to approve or contest provisional decisions.
5. **Escalation path:** If no response by deadline, escalate in order:
   1. Product Owner
   2. Program Manager / Delivery Manager
   3. Steering governance forum (if applicable)

## 9) Product Owner Review and Distribution Process

Before distribution to attendees:

1. Facilitator shares draft plan, agenda, and templates with PO.
2. PO reviews objectives, scope framing, attendee list, and decision points.
3. Facilitator incorporates feedback and marks version as final.
4. Send invitation and pre-read package to all attendees **at least 3 business days** prior to workshop.
5. Track RSVP confirmations and unresolved attendance risks.

## 10) Post-Workshop Follow-Up

Within 1 business day after workshop:

- Consolidate notes into a single draft requirements document.
- Attach decision log and open questions tracker.
- Assign owners and due dates for unresolved items.
- Share outcomes with PO for final review and next-step approval.

## 11) Related Templates

- Invitation template: `docs/workshops/templates/invitation_email.md`
- Decision log template: `docs/workshops/templates/decision_log_template.md`
