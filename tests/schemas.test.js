'use strict';
// Every widget is complete, documented, and uses only schema keywords the validator understands.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { unsupportedKeywords } = require('../scripts/lib/schema-validate');
const { toolkit } = require('./helpers');

const widgets = toolkit.loadWidgets();
const REQUIRED_META = ['title', 'description', 'x-use-when', 'x-dont-use-when', 'x-sizes', 'x-default-size', 'x-requires-charts'];

test('dashboard schema uses only supported keywords', () => {
  assert.deepStrictEqual(unsupportedKeywords(toolkit.loadDashboardSchema()), []);
});

for (const [type, w] of Object.entries(widgets)) {
  test(`${type}: has required metadata`, () => {
    for (const key of REQUIRED_META) assert.ok(key in w.raw, `schema.json is missing "${key}"`);
    assert.ok(w.raw['x-sizes'].includes(w.raw['x-default-size']), 'x-default-size must be one of x-sizes');
  });

  test(`${type}: uses only supported schema keywords`, () => {
    assert.deepStrictEqual(unsupportedKeywords(w.raw), []);
  });

  test(`${type}: has render.js and example.json`, () => {
    assert.ok(fs.existsSync(w.renderFile), 'missing render.js');
    assert.ok(fs.existsSync(w.exampleFile), 'missing example.json');
  });

  test(`${type}: render.js registers the widget`, () => {
    const source = fs.readFileSync(w.renderFile, 'utf8');
    assert.ok(source.includes(`DashKit.widgets.${type} =`), `render.js must assign DashKit.widgets.${type}`);
  });

  test(`${type}: example validates with no errors or warnings`, () => {
    const example = JSON.parse(fs.readFileSync(w.exampleFile, 'utf8'));
    assert.strictEqual(example.type, type);
    const spec = { title: 'Example', data_as_of: '2026-10-12T09:00:00-06:00', widgets: [Object.assign({}, example, { size: 'full' })] };
    if (!w.raw['x-sizes'].includes('full')) spec.widgets = [example, example, example, example].map((e, i) => Object.assign({}, e, { id: `${e.id}-${i}` }));
    const result = toolkit.validateDashboard(spec, widgets);
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.warnings, []);
  });
}
