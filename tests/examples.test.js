'use strict';
// The example dashboards are the reference for good specs: they must be clean.
const test = require('node:test');
const assert = require('node:assert');
const { toolkit, exampleSpecs } = require('./helpers');

for (const { file, spec } of exampleSpecs()) {
  test(`examples/${file} validates with no errors or warnings`, () => {
    const result = toolkit.validateDashboard(spec);
    assert.deepStrictEqual(result.errors, [], toolkit.formatIssues(result));
    assert.deepStrictEqual(result.warnings, [], toolkit.formatIssues(result));
  });
}
