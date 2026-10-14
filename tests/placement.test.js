'use strict';
/*
  Placement tests (roadmap stage 1): each fixture in tests/fixtures is a
  mistake Computer could make, and the validator must catch it.

  Fixture format:
    { "description": "...", "widgets": [...] or "spec": {...},
      "expect_error": "text in the error" } or "expect_warning": "..."
*/
const test = require('node:test');
const assert = require('node:assert');
const { toolkit, fixtureSpec, loadFixtures } = require('./helpers');

const widgets = toolkit.loadWidgets();

for (const fixture of loadFixtures()) {
  test(`${fixture.file}: ${fixture.description}`, () => {
    const result = toolkit.validateDashboard(fixtureSpec(fixture), widgets);
    const report = toolkit.formatIssues(result) || '(no issues)';
    if (fixture.expect_error) {
      assert.ok(result.errors.some((e) => `${e.path}: ${e.message}`.includes(fixture.expect_error)),
        `expected an error containing "${fixture.expect_error}". Got:\n${report}`);
    }
    if (fixture.expect_warning) {
      assert.deepStrictEqual(result.errors, [], `expected no errors. Got:\n${report}`);
      assert.ok(result.warnings.some((w) => `${w.path}: ${w.message}`.includes(fixture.expect_warning)),
        `expected a warning containing "${fixture.expect_warning}". Got:\n${report}`);
    }
    assert.ok(fixture.expect_error || fixture.expect_warning, 'fixture must set expect_error or expect_warning');
  });
}
