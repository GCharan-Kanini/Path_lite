import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Intake Workshop Documentation', () => {
  const facilitationPlanPath = 'docs/workshops/intake_workshop_facilitation_plan.md';
  const invitationTemplatePath = 'docs/workshops/templates/invitation_email.md';
  const decisionLogTemplatePath = 'docs/workshops/templates/decision_log_template.md';

  it('should have master facilitation plan at required path', () => {
    expect(existsSync(facilitationPlanPath)).toBe(true);
    
    const content = readFileSync(facilitationPlanPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('facilitation');
    expect(content).toContain('workshop');
  });

  it('should include time-boxed agenda and facilitator script in plan', () => {
    const content = readFileSync(facilitationPlanPath, 'utf-8');
    
    // Check for agenda with time boxes
    expect(content.toLowerCase()).toMatch(/agenda|schedule|timeline/);
    expect(content).toMatch(/\d+\s*(min|minutes|hour|hrs?)/i);
    
    // Check for facilitator script elements
    expect(content.toLowerCase()).toMatch(/script|prompts?|facilitator/);
    expect(content.toLowerCase()).toMatch(/responsibilities?/);
    expect(content.toLowerCase()).toMatch(/artifact|capture|record/);
  });

  it('should include materials checklist and distribution guidance in plan', () => {
    const content = readFileSync(facilitationPlanPath, 'utf-8');
    
    // Check for materials/pre-read checklist
    expect(content.toLowerCase()).toMatch(/materials?|pre-read|checklist/);
    
    // Check for PO review guidance
    expect(content.toLowerCase()).toMatch(/product owner|po|review/);
    
    // Check for 3 business day distribution requirement
    expect(content.toLowerCase()).toMatch(/3\s*(business\s*)?days?|three\s*days?/);
    expect(content.toLowerCase()).toMatch(/distribution?|distribute|send/);
  });

  it('should include stakeholder contingency and escalation guidance in plan', () => {
    const content = readFileSync(facilitationPlanPath, 'utf-8');
    
    // Check for absent participant handling
    expect(content.toLowerCase()).toMatch(/absent|missing|unavailable/);
    expect(content.toLowerCase()).toMatch(/stakeholder|participant/);
    
    // Check for delegate handling
    expect(content.toLowerCase()).toMatch(/delegate|proxy|substitute/);
    
    // Check for asynchronous capture
    expect(content.toLowerCase()).toMatch(/asynchronous|async|offline/);
    
    // Check for sign-off window
    expect(content.toLowerCase()).toMatch(/sign-off|approval|window/);
    
    // Check for escalation path
    expect(content.toLowerCase()).toMatch(/escalation?|escalate/);
  });

  it('should have invitation template with required content', () => {
    expect(existsSync(invitationTemplatePath)).toBe(true);
    
    const content = readFileSync(invitationTemplatePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    
    // Check for purpose
    expect(content.toLowerCase()).toMatch(/purpose|objective|goal/);
    
    // Check for expected outputs
    expect(content.toLowerCase()).toMatch(/output|deliverable|result|outcome/);
    
    // Check for pre-read/pre-work expectations
    expect(content.toLowerCase()).toMatch(/pre-read|pre-work|preparation|homework/);
    
    // Check for RSVP instructions
    expect(content.toLowerCase()).toMatch(/rsvp|respond|confirm|attendance/);
  });

  it('should have decision log template with required fields', () => {
    expect(existsSync(decisionLogTemplatePath)).toBe(true);
    
    const content = readFileSync(decisionLogTemplatePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    
    // Check for decision field
    expect(content.toLowerCase()).toMatch(/decision/);
    
    // Check for rationale field
    expect(content.toLowerCase()).toMatch(/rationale|reasoning|justification/);
    
    // Check for owner field
    expect(content.toLowerCase()).toMatch(/owner|responsible|assignee/);
    
    // Check for due date field
    expect(content.toLowerCase()).toMatch(/due\s*date|deadline|target\s*date/);
    
    // Check for follow-up tracking
    expect(content.toLowerCase()).toMatch(/follow-up|tracking|status|progress/);
  });
});