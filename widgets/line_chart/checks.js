'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
module.exports = function checkLineChart(widget) {
  const errors = [];
  const warnings = [];
  const periods = widget.periods;
  const series = widget.series;
  const refs = widget.reference_lines || [];

  const names = new Set();
  series.forEach((s, i) => {
    if (s.values.length !== periods.length) {
      errors.push({
        path: `.series[${i}].values`,
        message: `has ${s.values.length} values but there are ${periods.length} periods. Each series needs exactly one value per period, in the same order. Use null for a missing period.`
      });
    }
    if (names.has(s.name)) {
      errors.push({ path: `.series[${i}].name`, message: `"${s.name}" is used by more than one series. Series names must be unique.` });
    }
    names.add(s.name);
    if (s.values.length > 0 && s.values.every((v) => v === null)) {
      warnings.push({ path: `.series[${i}].values`, message: `"${s.name}" has no values. Remove the series, or keep it and explain why in note.` });
    }
  });

  if (widget.format === 'percent') {
    const tooBig = series.some((s) => s.values.some((v) => typeof v === 'number' && Math.abs(v) > 2)) ||
      refs.some((r) => Math.abs(r.value) > 2);
    if (tooBig) {
      warnings.push({ path: '.series', message: 'some percent values are larger than 2 (200%). Percent values are fractions: use 0.08 for 8%, including in reference_lines. If the values are right, keep them.' });
    }
  }

  if (periods.length < 4) {
    warnings.push({ path: '.periods', message: `a line with only ${periods.length} periods says little about a trend. Use bar_chart for a short run of periods.` });
  }

  if (widget.area && series.length > 2) {
    warnings.push({ path: '.area', message: `shaded areas for ${series.length} series hide each other. Remove "area", or show at most 2 series.` });
  }

  return { errors, warnings };
};
