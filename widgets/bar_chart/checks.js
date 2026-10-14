'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
module.exports = function checkBarChart(widget) {
  const errors = [];
  const warnings = [];
  const categories = widget.categories;
  const series = widget.series;

  const names = new Set();
  series.forEach((s, i) => {
    if (s.values.length !== categories.length) {
      errors.push({
        path: `.series[${i}].values`,
        message: `has ${s.values.length} values but there are ${categories.length} categories. Each series needs exactly one value per category, in the same order.`
      });
    }
    if (names.has(s.name)) {
      errors.push({ path: `.series[${i}].name`, message: `"${s.name}" is used by more than one series. Series names must be unique.` });
    }
    names.add(s.name);
  });

  if (widget.format === 'percent') {
    const tooBig = series.some((s) => s.values.some((v) => typeof v === 'number' && Math.abs(v) > 2));
    if (tooBig) {
      warnings.push({ path: '.series', message: 'some percent values are larger than 2 (200%). Percent values are fractions: use 0.45 for 45%. If the values are right, keep them.' });
    }
  }

  const longest = Math.max(...categories.map((c) => c.length));
  if ((widget.orientation || 'vertical') === 'vertical' && (categories.length > 8 || longest > 14)) {
    warnings.push({
      path: '.orientation',
      message: `vertical bars with ${categories.length} categories (longest label ${longest} characters) will crowd. Use "orientation": "horizontal".`
    });
  }

  if (widget.stacked && series.length < 2) {
    warnings.push({ path: '.stacked', message: 'stacking a single series has no effect. Remove "stacked" or add the series that make up the total.' });
  }

  return { errors, warnings };
};
