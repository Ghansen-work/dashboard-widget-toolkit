'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
module.exports = function checkGauge(widget) {
  const errors = [];
  const warnings = [];
  const target = widget.target;
  const range = widget.range;
  const value = widget.value;

  if (widget.format === 'percent') {
    const numbers = [value, target.value, target.warning_within].concat(range ? [range.min, range.max] : []);
    if (numbers.some((n) => typeof n === 'number' && Math.abs(n) > 2)) {
      warnings.push({
        path: '.value',
        message: 'a percent value, target, or range is larger than 2 (200%). Percent values are fractions: use 0.08 for an 8% floor. If the numbers are right, keep them.'
      });
    }
  }

  if (range) {
    if (range.min >= range.max) {
      errors.push({ path: '.range', message: `min (${range.min}) must be less than max (${range.max}).` });
    } else {
      const outside = [['value', value], ['target.value', target.value]]
        .filter(([, n]) => typeof n === 'number' && (n < range.min || n > range.max));
      outside.forEach(([name, n]) => {
        warnings.push({ path: `.${name}`, message: `${n} is outside range ${range.min} to ${range.max}, so the bar will be clipped. Widen range or leave it out to use the default.` });
      });
    }
  }

  if (target.kind === 'goal' && target.warning_within !== undefined) {
    warnings.push({ path: '.target.warning_within', message: 'only applies to floors and ceilings. A goal shows progress until it is reached. Remove warning_within.' });
  }

  return { errors, warnings };
};
