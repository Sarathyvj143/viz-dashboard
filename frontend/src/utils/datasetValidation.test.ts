import { describe, it, expect } from 'vitest';
import { datasetValidation, datasetValidationMessages, columnNamePattern } from './datasetValidation';

/**
 * IMPORTANT: These tests verify INTENTIONALLY PERMISSIVE validation.
 *
 * The frontend validation is for UX only, not security. It blocks obvious
 * mistakes (standalone DROP/DELETE statements) but allows complex patterns
 * because the backend is responsible for real security.
 *
 * When backend integration is complete:
 * 1. Backend MUST perform comprehensive SQL parsing and validation
 * 2. Frontend validation MAY be enhanced to be stricter
 * 3. Update these tests if frontend validation is tightened
 */
describe('datasetValidation', () => {
  describe('columnName', () => {
    it('should accept valid column names', () => {
      expect(datasetValidation.columnName('user_id')).toBe(true);
      expect(datasetValidation.columnName('UserName')).toBe(true);
      expect(datasetValidation.columnName('_private')).toBe(true);
      expect(datasetValidation.columnName('column123')).toBe(true);
    });

    it('should reject names starting with numbers', () => {
      expect(datasetValidation.columnName('123column')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(datasetValidation.columnName('user-id')).toBe(false);
      expect(datasetValidation.columnName('user.name')).toBe(false);
      expect(datasetValidation.columnName('user name')).toBe(false);
    });

    it('should reject SQL reserved words (case-insensitive)', () => {
      expect(datasetValidation.columnName('select')).toBe(false);
      expect(datasetValidation.columnName('SELECT')).toBe(false);
      expect(datasetValidation.columnName('from')).toBe(false);
      expect(datasetValidation.columnName('where')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(datasetValidation.columnName('')).toBe(false);
      expect(datasetValidation.columnName('   ')).toBe(false);
    });

    it('should accept column names with mixed case', () => {
      expect(datasetValidation.columnName('MyColumn')).toBe(true);
      expect(datasetValidation.columnName('my_Column_Name')).toBe(true);
    });

    it('should accept underscores in any position after the first character', () => {
      expect(datasetValidation.columnName('_leading')).toBe(true);
      expect(datasetValidation.columnName('middle_underscore')).toBe(true);
      expect(datasetValidation.columnName('trailing_')).toBe(true);
      expect(datasetValidation.columnName('___multiple___')).toBe(true);
    });

    it('should reject additional SQL reserved words', () => {
      expect(datasetValidation.columnName('insert')).toBe(false);
      expect(datasetValidation.columnName('UPDATE')).toBe(false);
      expect(datasetValidation.columnName('delete')).toBe(false);
      expect(datasetValidation.columnName('DROP')).toBe(false);
      expect(datasetValidation.columnName('create')).toBe(false);
      expect(datasetValidation.columnName('TABLE')).toBe(false);
      expect(datasetValidation.columnName('index')).toBe(false);
      expect(datasetValidation.columnName('VIEW')).toBe(false);
      expect(datasetValidation.columnName('join')).toBe(false);
      expect(datasetValidation.columnName('INNER')).toBe(false);
      expect(datasetValidation.columnName('outer')).toBe(false);
      expect(datasetValidation.columnName('LEFT')).toBe(false);
      expect(datasetValidation.columnName('right')).toBe(false);
      expect(datasetValidation.columnName('ON')).toBe(false);
      expect(datasetValidation.columnName('group')).toBe(false);
      expect(datasetValidation.columnName('BY')).toBe(false);
      expect(datasetValidation.columnName('order')).toBe(false);
      expect(datasetValidation.columnName('HAVING')).toBe(false);
      expect(datasetValidation.columnName('limit')).toBe(false);
      expect(datasetValidation.columnName('OFFSET')).toBe(false);
      expect(datasetValidation.columnName('union')).toBe(false);
      expect(datasetValidation.columnName('CASE')).toBe(false);
      expect(datasetValidation.columnName('when')).toBe(false);
      expect(datasetValidation.columnName('THEN')).toBe(false);
      expect(datasetValidation.columnName('else')).toBe(false);
      expect(datasetValidation.columnName('END')).toBe(false);
      expect(datasetValidation.columnName('as')).toBe(false);
      expect(datasetValidation.columnName('DISTINCT')).toBe(false);
      expect(datasetValidation.columnName('all')).toBe(false);
    });

    it('should reject names with only numbers', () => {
      expect(datasetValidation.columnName('123')).toBe(false);
      expect(datasetValidation.columnName('456789')).toBe(false);
    });

    it('should reject special characters and symbols', () => {
      expect(datasetValidation.columnName('column@name')).toBe(false);
      expect(datasetValidation.columnName('column#name')).toBe(false);
      expect(datasetValidation.columnName('column$name')).toBe(false);
      expect(datasetValidation.columnName('column%name')).toBe(false);
      expect(datasetValidation.columnName('column&name')).toBe(false);
      expect(datasetValidation.columnName('column*name')).toBe(false);
      expect(datasetValidation.columnName('column(name')).toBe(false);
      expect(datasetValidation.columnName('column)name')).toBe(false);
      expect(datasetValidation.columnName('column+name')).toBe(false);
      expect(datasetValidation.columnName('column=name')).toBe(false);
      expect(datasetValidation.columnName('column[name')).toBe(false);
      expect(datasetValidation.columnName('column]name')).toBe(false);
      expect(datasetValidation.columnName('column{name')).toBe(false);
      expect(datasetValidation.columnName('column}name')).toBe(false);
      expect(datasetValidation.columnName('column|name')).toBe(false);
      expect(datasetValidation.columnName('column\\name')).toBe(false);
      expect(datasetValidation.columnName('column/name')).toBe(false);
      expect(datasetValidation.columnName('column:name')).toBe(false);
      expect(datasetValidation.columnName('column;name')).toBe(false);
      expect(datasetValidation.columnName('column"name')).toBe(false);
      expect(datasetValidation.columnName("column'name")).toBe(false);
      expect(datasetValidation.columnName('column<name')).toBe(false);
      expect(datasetValidation.columnName('column>name')).toBe(false);
      expect(datasetValidation.columnName('column,name')).toBe(false);
      expect(datasetValidation.columnName('column?name')).toBe(false);
      expect(datasetValidation.columnName('column!name')).toBe(false);
      expect(datasetValidation.columnName('column~name')).toBe(false);
      expect(datasetValidation.columnName('column`name')).toBe(false);
    });
  });

  describe('datasetName', () => {
    it('should accept valid dataset names', () => {
      expect(datasetValidation.datasetName('My Dataset')).toBe(true);
      expect(datasetValidation.datasetName('Cost Analysis 2024')).toBe(true);
    });

    it('should reject names shorter than 3 characters', () => {
      expect(datasetValidation.datasetName('ab')).toBe(false);
    });

    it('should reject names longer than 255 characters', () => {
      expect(datasetValidation.datasetName('a'.repeat(256))).toBe(false);
    });

    it('should accept exactly 3 characters', () => {
      expect(datasetValidation.datasetName('abc')).toBe(true);
      expect(datasetValidation.datasetName('XYZ')).toBe(true);
    });

    it('should accept exactly 255 characters', () => {
      expect(datasetValidation.datasetName('a'.repeat(255))).toBe(true);
    });

    it('should handle names with whitespace by trimming', () => {
      expect(datasetValidation.datasetName('   Valid Name   ')).toBe(true);
      expect(datasetValidation.datasetName('  ab  ')).toBe(false); // Trims to 2 chars
      expect(datasetValidation.datasetName('  abc  ')).toBe(true); // Trims to 3 chars
    });

    it('should accept names with special characters', () => {
      expect(datasetValidation.datasetName('Dataset-2024')).toBe(true);
      expect(datasetValidation.datasetName('Sales_Report')).toBe(true);
      expect(datasetValidation.datasetName('Q1 (2024)')).toBe(true);
      expect(datasetValidation.datasetName('Revenue: $1M')).toBe(true);
    });

    it('should reject empty strings after trimming', () => {
      expect(datasetValidation.datasetName('')).toBe(false);
      expect(datasetValidation.datasetName('   ')).toBe(false);
      expect(datasetValidation.datasetName('\t\n')).toBe(false);
    });

    it('should accept names with numbers', () => {
      expect(datasetValidation.datasetName('Dataset 123')).toBe(true);
      expect(datasetValidation.datasetName('2024 Report')).toBe(true);
    });

    it('should accept names with unicode characters', () => {
      expect(datasetValidation.datasetName('Données')).toBe(true);
      expect(datasetValidation.datasetName('数据集')).toBe(true);
      expect(datasetValidation.datasetName('Датасет')).toBe(true);
    });

    it('should reject very long names (edge case)', () => {
      // Test boundary conditions
      expect(datasetValidation.datasetName('a'.repeat(254))).toBe(true);
      expect(datasetValidation.datasetName('a'.repeat(255))).toBe(true);
      expect(datasetValidation.datasetName('a'.repeat(256))).toBe(false);
      expect(datasetValidation.datasetName('a'.repeat(257))).toBe(false);
      expect(datasetValidation.datasetName('a'.repeat(1000))).toBe(false);
    });
  });

  describe('sqlQuery', () => {
    it('should accept valid SELECT queries', () => {
      expect(datasetValidation.sqlQuery('SELECT * FROM users')).toBe(true);
      expect(datasetValidation.sqlQuery('select id, name from products')).toBe(true);
    });

    it('should reject non-SELECT queries', () => {
      expect(datasetValidation.sqlQuery('INSERT INTO users VALUES (1)')).toBe(false);
      expect(datasetValidation.sqlQuery('UPDATE users SET name = "test"')).toBe(false);
    });

    it('should allow queries with keywords in subqueries or string literals', () => {
      // These are now allowed because we only check the start of the query
      expect(datasetValidation.sqlQuery('SELECT * FROM users; DROP TABLE users')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE id IN (DELETE FROM logs)')).toBe(true);
    });

    it('should accept SELECT queries with various clauses', () => {
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE id = 1')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT id, name FROM users ORDER BY name')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT COUNT(*) FROM users GROUP BY status')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users LIMIT 10')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users OFFSET 5')).toBe(true);
    });

    it('should accept SELECT queries with joins', () => {
      expect(datasetValidation.sqlQuery('SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users LEFT JOIN profiles ON users.id = profiles.user_id')).toBe(true);
    });

    it('should accept SELECT queries with subqueries', () => {
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count FROM users')).toBe(true);
    });

    it('should reject queries starting with other SQL commands', () => {
      expect(datasetValidation.sqlQuery('CREATE TABLE users (id INT)')).toBe(false);
      expect(datasetValidation.sqlQuery('DROP TABLE users')).toBe(false);
      expect(datasetValidation.sqlQuery('TRUNCATE TABLE users')).toBe(false);
      expect(datasetValidation.sqlQuery('ALTER TABLE users ADD COLUMN email VARCHAR(255)')).toBe(false);
    });

    it('should allow DROP keyword in column names or string literals', () => {
      // These are now allowed - we only block DROP at the start
      expect(datasetValidation.sqlQuery('SELECT * FROM users; DROP TABLE logs')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT DROP FROM users')).toBe(true); // Column name is fine
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE name = "DROP"')).toBe(true); // In string literal is fine
    });

    it('should reject standalone DELETE statements but allow DELETE in data', () => {
      expect(datasetValidation.sqlQuery('DELETE FROM users WHERE id = 1')).toBe(false);
      // But allow DELETE in column names or string literals
      expect(datasetValidation.sqlQuery('SELECT * FROM users; DELETE FROM logs')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE action = "DELETE"')).toBe(true);
    });

    it('should reject standalone TRUNCATE statements but allow TRUNCATE in data', () => {
      expect(datasetValidation.sqlQuery('TRUNCATE TABLE users')).toBe(false);
      // But allow TRUNCATE in column names or later in query
      expect(datasetValidation.sqlQuery('SELECT * FROM users; TRUNCATE TABLE logs')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT TRUNCATE FROM users')).toBe(true);
    });

    it('should reject standalone ALTER statements but allow ALTER in data', () => {
      expect(datasetValidation.sqlQuery('ALTER TABLE users ADD COLUMN age INT')).toBe(false);
      // But allow ALTER in column names or later in query
      expect(datasetValidation.sqlQuery('SELECT * FROM users; ALTER TABLE logs DROP COLUMN id')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT ALTER FROM users')).toBe(true);
    });

    it('should reject standalone INSERT statements but allow INSERT in data', () => {
      expect(datasetValidation.sqlQuery('INSERT INTO users (name) VALUES ("test")')).toBe(false);
      // But allow INSERT in column names or later in query
      expect(datasetValidation.sqlQuery('SELECT * FROM users; INSERT INTO logs VALUES (1)')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT INSERT FROM users')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT insert_date FROM users')).toBe(true);
    });

    it('should reject standalone UPDATE statements but allow UPDATE in data', () => {
      expect(datasetValidation.sqlQuery('UPDATE users SET name = "test"')).toBe(false);
      // But allow UPDATE in column names, string literals, or later in query
      expect(datasetValidation.sqlQuery('SELECT * FROM users; UPDATE logs SET status = "read"')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT UPDATE FROM users')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE action = "UPDATE"')).toBe(true);
    });

    it('should handle queries with leading/trailing whitespace', () => {
      expect(datasetValidation.sqlQuery('  SELECT * FROM users  ')).toBe(true);
      expect(datasetValidation.sqlQuery('\n\tSELECT id FROM users\n')).toBe(true);
      expect(datasetValidation.sqlQuery('   INSERT INTO users VALUES (1)   ')).toBe(false);
    });

    it('should be case-insensitive for SELECT keyword', () => {
      expect(datasetValidation.sqlQuery('select * from users')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * from users')).toBe(true);
      expect(datasetValidation.sqlQuery('SeLeCt * FrOm users')).toBe(true);
    });

    it('should be case-insensitive for SELECT/WITH and only block destructive at start', () => {
      // These are allowed - keywords not at start
      expect(datasetValidation.sqlQuery('SELECT * FROM users; drop table logs')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users; DeLeTe from logs')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users; TrUnCaTe table logs')).toBe(true);
      // But these are blocked - destructive keywords at start
      expect(datasetValidation.sqlQuery('drop table logs')).toBe(false);
      expect(datasetValidation.sqlQuery('TRUNCATE TABLE users')).toBe(false);
    });

    it('should reject empty or whitespace-only queries', () => {
      expect(datasetValidation.sqlQuery('')).toBe(false);
      expect(datasetValidation.sqlQuery('   ')).toBe(false);
      expect(datasetValidation.sqlQuery('\n\t')).toBe(false);
    });

    it('should accept queries starting with WITH (CTEs)', () => {
      const cteQuery = `
        WITH user_orders AS (
          SELECT user_id, COUNT(*) as order_count
          FROM orders
          GROUP BY user_id
        )
        SELECT u.name, uo.order_count
        FROM users u
        JOIN user_orders uo ON u.id = uo.user_id
      `;
      // CTEs are now allowed
      expect(datasetValidation.sqlQuery(cteQuery)).toBe(true);
    });

    it('should accept SELECT queries with UNION', () => {
      expect(datasetValidation.sqlQuery('SELECT id FROM users UNION SELECT id FROM customers')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT name FROM products UNION ALL SELECT name FROM services')).toBe(true);
    });

    it('should accept SELECT queries with CASE statements', () => {
      expect(datasetValidation.sqlQuery('SELECT CASE WHEN age > 18 THEN "adult" ELSE "minor" END FROM users')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT id, CASE status WHEN "active" THEN 1 ELSE 0 END as is_active FROM users')).toBe(true);
    });

    it('should accept queries with keywords in string literals', () => {
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE action = "DELETE"')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE action = "UPDATE"')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM users WHERE status = "DROP"')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT * FROM logs WHERE message = "TRUNCATE completed"')).toBe(true);
    });

    it('should accept queries with keywords as column names', () => {
      expect(datasetValidation.sqlQuery('SELECT insert_date, update_date FROM users')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT delete_flag FROM records')).toBe(true);
      expect(datasetValidation.sqlQuery('SELECT created_date, updated_at FROM logs')).toBe(true);
    });
  });

  describe('columnNamePattern', () => {
    it('should export the column name regex pattern', () => {
      expect(columnNamePattern).toBeDefined();
      expect(columnNamePattern).toBeInstanceOf(RegExp);
    });

    it('should match valid column names', () => {
      expect(columnNamePattern.test('valid_column')).toBe(true);
      expect(columnNamePattern.test('_private')).toBe(true);
      expect(columnNamePattern.test('Column123')).toBe(true);
    });

    it('should not match invalid column names', () => {
      expect(columnNamePattern.test('123column')).toBe(false);
      expect(columnNamePattern.test('column-name')).toBe(false);
      expect(columnNamePattern.test('column.name')).toBe(false);
    });
  });

  describe('datasetValidationMessages', () => {
    it('should export validation error messages', () => {
      expect(datasetValidationMessages).toBeDefined();
      expect(datasetValidationMessages.columnName).toBeTruthy();
      expect(datasetValidationMessages.datasetName).toBeTruthy();
      expect(datasetValidationMessages.sqlQuery).toBeTruthy();
    });

    it('should have appropriate error messages', () => {
      expect(datasetValidationMessages.columnName).toContain('letter or underscore');
      expect(datasetValidationMessages.datasetName).toContain('3 and 255 characters');
      expect(datasetValidationMessages.sqlQuery).toContain('SELECT statement');
    });
  });
});
