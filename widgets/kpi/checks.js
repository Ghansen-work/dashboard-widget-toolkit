'use strict';
// Checks the schema can't express. See "x-checks" in schema.json.
module.exports = function checkKpi(widget) {
  const errors = [];
  const warnings = [];

  if (widget.format === 'percent' && typeof widget.value === 'number' && Math.abs(widget.value) > 2) {
    warnings.push({
      path: '.value',
      message: `${widget.value} would display as ${Math.round(widget.value * 100)}%. Percent values are fractions: use 0.45 for 45%. If that is really the number, keep it.`
    });
  }

  const delta = widget.delta;
  if (delta && (delta.format || 'percent') === 'percent' && Math.abs(delta.value) > 2) {
    warnings.push({
      path: '.delta.value',
      message: `${delta.value} would display as ${Math.round(delta.value * 100)}%. Percent changes are fractions: use 0.082 for +8.2%. If that is really the change, keep it.`
    });
  }

  return { errors, warnings };
};
