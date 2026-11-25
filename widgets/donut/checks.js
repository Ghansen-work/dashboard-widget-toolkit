'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
module.exports = function checkDonut(widget) {
  const errors = [];
  const warnings = [];
  const slices = widget.slices;

  const labels = new Set();
  slices.forEach((s, i) => {
    if (labels.has(s.label)) {
      errors.push({ path: `.slices[${i}].label`, message: `"${s.label}" is used by more than one slice. Slice labels must be unique.` });
    }
    labels.add(s.label);
  });

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    errors.push({ path: '.slices', message: 'every slice is 0, so there is no whole to split. Use a kpi showing 0, or leave the widget out and say why.' });
    return { errors, warnings };
  }

  if (Math.abs(total - 1) < 0.011 && slices.every((s) => s.value <= 1)) {
    warnings.push({ path: '.slices', message: 'the values add up to 1, so they look like shares. Pass the raw amounts (counts or dollars); the donut computes shares and shows the real total.' });
  }

  const ranked = slices.filter((s, i) => !(i === slices.length - 1 && /^other\b/i.test(s.label)));
  const unsorted = ranked.some((s, i) => i > 0 && s.value > ranked[i - 1].value);
  if (unsorted) {
    warnings.push({ path: '.slices', message: 'slices are not sorted largest first. Sort them by value, with any "Other" slice last.' });
  }

  return { errors, warnings };
};
