'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
const NUMERIC = new Set(['number', 'integer', 'currency', 'percent']);
const LEVELS = ['good', 'warning', 'critical', 'neutral'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ERRORS_PER_COLUMN = 3;

function cellProblem(value, kind) {
  if (value === null || value === undefined) return null;
  if (NUMERIC.has(kind)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `expected a raw number for a ${kind} column, got ${JSON.stringify(value)}. Don't pre-format numbers.`;
    }
    if (kind === 'integer' && !Number.isInteger(value)) return `expected a whole number, got ${value}.`;
    return null;
  }
  if (kind === 'date') {
    return typeof value === 'string' && ISO_DATE.test(value) ? null : `expected a date as "YYYY-MM-DD", got ${JSON.stringify(value)}.`;
  }
  if (kind === 'status') {
    const ok = value && typeof value === 'object' && !Array.isArray(value) &&
      typeof value.text === 'string' && value.text.length > 0 && LEVELS.includes(value.level) &&
      Object.keys(value).every((k) => k === 'text' || k === 'level');
    return ok ? null : `expected {"text": "...", "level": "${LEVELS.join('" | "')}"}, got ${JSON.stringify(value)}.`;
  }
  return typeof value === 'string' || typeof value === 'number' ? null : `expected text, got ${JSON.stringify(value)}.`;
}

module.exports = function checkTable(widget) {
  const errors = [];
  const warnings = [];
  const columns = widget.columns;
  const rows = widget.rows;

  const kinds = new Map();
  columns.forEach((c, i) => {
    if (kinds.has(c.key)) errors.push({ path: `.columns[${i}].key`, message: `"${c.key}" is used by more than one column. Column keys must be unique.` });
    kinds.set(c.key, c.format || 'text');
  });

  const errorCount = new Map();
  let bigPercent = false;
  rows.forEach((row, r) => {
    Object.keys(row).forEach((key) => {
      if (!kinds.has(key)) {
        errors.push({ path: `.rows[${r}].${key}`, message: `"${key}" is not a column key. Columns: ${[...kinds.keys()].join(', ')}. Add a column or remove this field.` });
        return;
      }
      const kind = kinds.get(key);
      const problem = cellProblem(row[key], kind);
      if (problem) {
        const n = (errorCount.get(key) || 0) + 1;
        errorCount.set(key, n);
        if (n <= MAX_ERRORS_PER_COLUMN) errors.push({ path: `.rows[${r}].${key}`, message: problem });
      }
      if (kind === 'percent' && typeof row[key] === 'number' && Math.abs(row[key]) > 2) bigPercent = true;
    });
  });
  errorCount.forEach((n, key) => {
    if (n > MAX_ERRORS_PER_COLUMN) errors.push({ path: '.rows', message: `${n - MAX_ERRORS_PER_COLUMN} more cells in column "${key}" have the same problem.` });
  });

  if (bigPercent) {
    warnings.push({ path: '.rows', message: 'some percent values are larger than 2 (200%). Percent values are fractions: use 0.45 for 45%. If the values are right, keep them.' });
  }

  if (typeof widget.total_count === 'number' && widget.total_count < rows.length) {
    errors.push({ path: '.total_count', message: `is ${widget.total_count} but there are ${rows.length} rows. total_count is the full count before the top-N cut, so it can't be smaller.` });
  }
  if (rows.length === 50 && widget.total_count === undefined) {
    warnings.push({ path: '.total_count', message: 'the table has the maximum 50 rows. Add total_count so readers know whether the list was cut off.' });
  }

  return { errors, warnings };
};
