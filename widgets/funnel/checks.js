'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
module.exports = function checkFunnel(widget) {
  const errors = [];
  const warnings = [];
  const stages = widget.stages;

  const labels = new Set();
  stages.forEach((s, i) => {
    if (labels.has(s.label)) {
      errors.push({ path: `.stages[${i}].label`, message: `"${s.label}" is used by more than one stage. Stage labels must be unique.` });
    }
    labels.add(s.label);
  });

  if (stages.every((s) => s.value === null)) {
    warnings.push({ path: '.stages', message: 'every stage is null, so the funnel will be empty. Leave it out, or explain the missing data in note.' });
  }

  if ((widget.mode || 'conversion') === 'conversion') {
    let previous = null;
    for (let i = 0; i < stages.length; i++) {
      const v = stages[i].value;
      if (v === null) continue;
      if (previous && v > previous.value) {
        warnings.push({
          path: `.stages[${i}].value`,
          message: `"${stages[i].label}" (${v}) is larger than "${previous.label}" (${previous.value}). In a conversion funnel each stage is a subset of the one before. If these are counts currently sitting at each step, use "mode": "snapshot".`
        });
        break;
      }
      previous = { label: stages[i].label, value: v };
    }
  }

  return { errors, warnings };
};
