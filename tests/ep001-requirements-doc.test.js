const { describe, it, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('EP-001 Draft Requirements Document', () => {
  const requirementsDocPath = 'docs/requirements/EP-001_draft_requirements.md';

  it('should exist at the specified path', () => {
    expect(fs.existsSync(requirementsDocPath)).toBe(true);
    
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should contain machine-readable requirements section', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for machine-readable requirements indicators
    expect(content.toLowerCase()).toMatch(/machine.?readable|structured|yaml|json|table/);
    expect(content.toLowerCase()).toMatch(/requirements?/);
    
    // Should have some structured format indicators
    expect(content).toMatch(/\|.*\||```|---|###|####/);
  });

  it('should contain human-readable requirements section', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for human-readable requirements indicators
    expect(content.toLowerCase()).toMatch(/human.?readable|narrative|description/);
    expect(content.toLowerCase()).toMatch(/requirements?/);
    
    // Should have narrative content
    expect(content.length).toBeGreaterThan(500); // Substantial content
  });

  it('should contain explicit scope boundaries', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for in-scope section
    expect(content.toLowerCase()).toMatch(/in.?scope|within scope|included/);
    
    // Check for out-of-scope section  
    expect(content.toLowerCase()).toMatch(/out.?of.?scope|excluded|not included/);
    
    // Should have scope boundary indicators
    expect(content.toLowerCase()).toMatch(/scope|boundary|boundaries/);
  });

  it('should contain success criteria', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for success criteria section
    expect(content.toLowerCase()).toMatch(/success criteria|acceptance criteria|definition of done/);
    
    // Should have measurable indicators
    expect(content.toLowerCase()).toMatch(/measurable|metric|kpi|target|goal/);
  });

  it('should contain implementation constraints', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for constraints section
    expect(content.toLowerCase()).toMatch(/constraints?|dependencies|limitations/);
    
    // Check for implementation context
    expect(content.toLowerCase()).toMatch(/implementation|technical|system/);
  });

  it('should contain decision log coverage', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for decision log section
    expect(content.toLowerCase()).toMatch(/decision log|decisions/);
    
    // Check for open decisions
    expect(content.toLowerCase()).toMatch(/open|pending|unresolved/);
    
    // Check for closed decisions
    expect(content.toLowerCase()).toMatch(/closed|resolved|approved|decided/);
  });

  it('should contain follow-up ownership details', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for follow-up section
    expect(content.toLowerCase()).toMatch(/follow.?up|action items?|next steps/);
    
    // Check for ownership indicators
    expect(content.toLowerCase()).toMatch(/owner|responsible|assignee|assigned/);
    
    // Check for due date indicators
    expect(content.toLowerCase()).toMatch(/due date|deadline|target date|by/);
  });

  it('should contain workshop output content', () => {
    const content = fs.readFileSync(requirementsDocPath, 'utf-8');
    
    // Check for workshop-derived content indicators
    expect(content.toLowerCase()).toMatch(/workshop|intake|facilitation/);
    
    // Should reference workshop outputs like those in facilitation plan
    expect(content.toLowerCase()).toMatch(/stakeholder|participant|attendee/);
    
    // Should have substantial content indicating workshop outputs
    expect(content.split('\n').length).toBeGreaterThan(20); // Multi-section document
  });
});