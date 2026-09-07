const fs = require('fs');
const path = require('path');

describe('Persistence Layer Documentation', () => {
  describe('AC-1: Canonical SQL Schema Document', () => {
    test('should have vertical slice schema file with normalized tables and constraints', () => {
      const schemaPath = 'docs/db/schema/vertical_slice_schema.sql';
      expect(fs.existsSync(schemaPath)).toBe(true);
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Verify CREATE TABLE statements exist
      expect(schemaContent).toMatch(/CREATE TABLE/i);
      
      // Verify PRIMARY KEY constraints
      expect(schemaContent).toMatch(/PRIMARY KEY/i);
      
      // Verify FOREIGN KEY constraints for normalization
      expect(schemaContent).toMatch(/FOREIGN KEY|REFERENCES/i);
      
      // Verify INDEX definitions
      expect(schemaContent).toMatch(/CREATE INDEX|INDEX/i);
      
      // Verify sensitive data annotations (PII/PHI)
      expect(schemaContent).toMatch(/PII|PHI|sensitive|confidential/i);
    });
  });

  describe('AC-2: Initial Migration File', () => {
    test('should have migration file with deterministic order and idempotency documentation', () => {
      const migrationPath = 'docs/db/migrations/001_create_vertical_slice_tables.sql';
      expect(fs.existsSync(migrationPath)).toBe(true);
      
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      // Verify ordered DDL statements
      expect(migrationContent).toMatch(/CREATE TABLE/i);
      
      // Verify idempotency documentation
      expect(migrationContent).toMatch(/idempotent|repeatable|IF NOT EXISTS/i);
      
      // Verify deterministic order documentation
      expect(migrationContent).toMatch(/order|sequence|deterministic/i);
    });
  });

  describe('AC-3: Repository/Data-Access Contracts', () => {
    test('should have repository contract with method signatures and semantics', () => {
      const contractPath = 'docs/db/repository/contracts/vertical_slice_repository_contract.md';
      expect(fs.existsSync(contractPath)).toBe(true);
      
      const contractContent = fs.readFileSync(contractPath, 'utf8');
      
      // Verify method intent signatures
      expect(contractContent).toMatch(/method|function|signature/i);
      
      // Verify idempotency specifications
      expect(contractContent).toMatch(/idempotent|idempotency/i);
      
      // Verify transaction expectations
      expect(contractContent).toMatch(/transaction|transactional/i);
      
      // Verify error/retry semantics
      expect(contractContent).toMatch(/error|retry|exception/i);
    });
  });

  describe('AC-4: Transaction Strategy Documentation', () => {
    test('should have transaction strategy with ACID flows and compensation logic', () => {
      const strategyPath = 'docs/db/transaction/transaction_strategy_and_compensation.md';
      expect(fs.existsSync(strategyPath)).toBe(true);
      
      const strategyContent = fs.readFileSync(strategyPath, 'utf8');
      
      // Verify ACID transaction definitions
      expect(strategyContent).toMatch(/ACID|atomic|consistent|isolated|durable/i);
      
      // Verify single-transaction flows for multi-table operations
      expect(strategyContent).toMatch(/single.transaction|multi.table/i);
      
      // Verify compensating/rollback logic
      expect(strategyContent).toMatch(/compensat|rollback|undo/i);
      
      // Verify pseudocode for non-atomic cases
      expect(strategyContent).toMatch(/pseudocode|algorithm|steps/i);
    });
  });

  describe('AC-5: Database README Documentation', () => {
    test('should have database README with migration and contract guidance', () => {
      const readmePath = 'docs/db/README.md';
      expect(fs.existsSync(readmePath)).toBe(true);
      
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // Verify migration application instructions
      expect(readmeContent).toMatch(/migration|apply|development|testing/i);
      
      // Verify contract-to-implementation mapping
      expect(readmeContent).toMatch(/contract|implementation|mapping|responsibility/i);
    });
  });

  describe('AC-6: EP-001 Requirements Linkage', () => {
    test('should have EP-001 updated with persistence artifacts and security linkage', () => {
      const ep001Path = 'docs/requirements/EP-001_draft_requirements.md';
      expect(fs.existsSync(ep001Path)).toBe(true);
      
      const ep001Content = fs.readFileSync(ep001Path, 'utf8');
      
      // Verify references to new persistence artifacts
      expect(ep001Content).toMatch(/persistence|database|schema|migration/i);
      
      // Verify security/compliance review linkage
      expect(ep001Content).toMatch(/security|compliance|review/i);
      
      // Verify US-002 vertical slice reference
      expect(ep001Content).toMatch(/US-002|vertical.slice/i);
    });
  });

  describe('AC-7: Unit/Integration Test Guidance', () => {
    test('should have explicit test guidance for idempotency and transaction failures', () => {
      // Check if test guidance exists in any of the persistence documentation
      const docPaths = [
        'docs/db/README.md',
        'docs/db/repository/contracts/vertical_slice_repository_contract.md',
        'docs/db/transaction/transaction_strategy_and_compensation.md'
      ];
      
      let hasTestGuidance = false;
      let testGuidanceContent = '';
      
      for (const docPath of docPaths) {
        if (fs.existsSync(docPath)) {
          const content = fs.readFileSync(docPath, 'utf8');
          if (content.match(/test|testing|unit.test|integration.test/i)) {
            hasTestGuidance = true;
            testGuidanceContent += content;
          }
        }
      }
      
      expect(hasTestGuidance).toBe(true);
      
      // Verify idempotency test guidance
      expect(testGuidanceContent).toMatch(/idempotent|idempotency.*test/i);
      
      // Verify transaction failure scenario guidance
      expect(testGuidanceContent).toMatch(/transaction.*fail|rollback.*test|failure.*scenario/i);
      
      // Verify unit/integration test distinction
      expect(testGuidanceContent).toMatch(/unit.*test|integration.*test/i);
    });
  });
});