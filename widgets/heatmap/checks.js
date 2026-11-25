'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
function duplicates(labels, field, errors) {
  const seen = new Set();
  labels.forEach((label, i) => {
    if (seen.has(label)) errors.push({ path: `.${field}[${i}]`, message: `"${label}" appears more than once. Labels must be unique.` });
    seen.add(label);
  });
}

module.exports = function checkHeatmap(widget) {
  const errors = [];
  const warnings = [];
  const rows = widget.row_labels;
  const columns = widget.column_labels;
  const values = widget.values;

  duplicates(rows, 'row_labels', errors);
  duplicates(columns, 'column_labels', errors);

  if (values.length !== rows.length) {
    errors.push({
      path: '.values',
      message: `has ${values.length} rows but there are ${rows.length} row labels. values needs one list per row label, in the same order.`
    });
  }
  values.forEach((row, r) => {
    if (row.length !== columns.length) {
      errors.push({
        path: `.values[${r}]`,
        message: `has ${row.length} values but there are ${columns.length} column labels. Each row needs one value per column, in the same order. Use null for a missing cell.`
      });
    }
  });

  const cells = [].concat(...values);
  if (cells.length && cells.every((v) => v === null)) {
    warnings.push({ path: '.values', message: 'every cell is null, so the grid will be empty. Leave it out, or explain the missing data in note.' });
  }

  if (widget.format === 'percent' && cells.some((v) => typeof v === 'number' && Math.abs(v) > 2)) {
    warnings.push({ path: '.values', message: 'some percent values are larger than 2 (200%). Percent values are fractions: use 0.45 for 45%. If the values are right, keep them.' });
  }

  if (columns.length > 12 && (widget.size || 'full') !== 'full') {
    warnings.push({ path: '.size', message: `${columns.length} columns will be cramped at size ${widget.size}. Use "size": "full".` });
  }

  return { errors, warnings };
};
