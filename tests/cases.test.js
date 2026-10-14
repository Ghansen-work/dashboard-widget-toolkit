'use strict';
// Sanity checks for the Computer test cases and the grader itself.
const test = require('node:test');
const assert = require('node:assert');
const { grade, cases } = require('../scripts/check-case');
const { toolkit } = require('./helpers');

const types = Object.keys(toolkit.loadWidgets());

test('case ids are unique and reference real widget types', () => {
  const ids = cases.map((c) => c.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const c of cases) {
    const e = c.expect || {};
    for (const t of [].concat(e.must_include || [], e.must_not_include || [], (e.has || []).map((h) => h.type))) {
      assert.ok(types.includes(t), `case ${c.id} references unknown widget "${t}"`);
    }
  }
});

test('grader passes a good spec and fails a bad one', () => {
  const ranking = cases.find((c) => c.id === 'ranking');
  const good = { title: 'Revenue by AM', data_as_of: '2026-10-12T09:00:00-06:00', widgets: [
    { type: 'bar_chart', id: 'r', title: 'Revenue by AM', size: 'full', format: 'currency', orientation: 'horizontal',
      categories: ['A', 'B'], series: [{ name: 'Revenue', values: [2, 1] }] }
  ] };
  assert.ok(grade(ranking, good).results.every((r) => r.ok));

  const bad = JSON.parse(JSON.stringify(good));
  delete bad.widgets[0].orientation;
  assert.ok(grade(ranking, bad).results.some((r) => !r.ok));
});
