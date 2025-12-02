/**
 * Validation utilities for dataset operations
 */

/**
 * Validates a column name follows SQL identifier rules
 * - Must start with a letter or underscore
 * - Can contain letters, numbers, and underscores
 * - Cannot be a SQL reserved word
 */
export const columnNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Common SQL reserved words to avoid as column names
 */
const SQL_RESERVED_WORDS = new Set([
  'select', 'from', 'where', 'insert', 'update', 'delete', 'drop', 'create',
  'table', 'index', 'view', 'join', 'inner', 'outer', 'left', 'right',
  'on', 'group', 'by', 'order', 'having', 'limit', 'offset', 'union',
  'case', 'when', 'then', 'else', 'end', 'as', 'distinct', 'all',
]);

export const datasetValidation = {
  /**
   * Validates a column name
   */
  columnName: (name: string): boolean => {
    if (!name || !columnNamePattern.test(name)) {
      return false;
    }
    // Check not a reserved word (case-insensitive)
    return !SQL_RESERVED_WORDS.has(name.toLowerCase());
  },

  /**
   * Validates a dataset name
   */
  datasetName: (name: string): boolean => {
    return name.trim().length >= 3 && name.trim().length <= 255;
  },

  /**
   * Basic SQL query validation
   *
   * SECURITY NOTE: This is CLIENT-SIDE UX validation only. It prevents obvious
   * mistakes but does NOT provide security. The backend MUST perform comprehensive
   * SQL parsing, validation, and sandboxing before executing any query.
   *
   * This function only blocks standalone destructive statements (DROP, TRUNCATE, etc.)
   * at the start of the query. It INTENTIONALLY allows:
   * - Semicolon-separated statements (SELECT ...; DROP ...)
   * - Destructive operations in subqueries or string literals
   * - Complex SQL injection patterns
   *
   * Backend validation requirements:
   * - Use SQL parser (e.g., sqlparse) to detect ALL statement types
   * - Reject queries with multiple statements
   * - Whitelist only SELECT and WITH (CTE) operations
   * - Implement query timeouts and result row limits
   * - Enforce workspace-level access controls
   */
  sqlQuery: (query: string): boolean => {
    const trimmed = query.trim();

    // Must start with SELECT or WITH (for CTEs)
    if (!/^\s*(SELECT|WITH)\s+/i.test(trimmed)) {
      return false;
    }

    // Block obvious destructive operations at the start of query
    if (/^\s*(DROP|TRUNCATE|CREATE)\s+/i.test(trimmed)) {
      return false;
    }

    return true;
  },
};

export const datasetValidationMessages = {
  columnName: 'Column name must start with a letter or underscore, contain only letters, numbers, and underscores, and not be a SQL reserved word',
  datasetName: 'Dataset name must be between 3 and 255 characters',
  sqlQuery: 'Query must be a SELECT statement or CTE (WITH clause). Complex validation is performed on the backend.',
};
