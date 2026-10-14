'use strict';
// Rules the schema can't express (cross-field consistency, sanity checks).
// Return paths relative to the widget, e.g. ".series[0].values".
// Errors block the build. Warnings tell Computer something is probably wrong.
module.exports = function checkMyWidget(widget) {
  const errors = [];
  const warnings = [];
  return { errors, warnings };
};
