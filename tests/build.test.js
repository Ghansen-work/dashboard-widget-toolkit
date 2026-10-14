'use strict';
// The built HTML must work inside Computer's sandbox and be safe with any spec text.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const config = require('../scripts/lib/config');
const { toolkit, exampleSpecs } = require('./helpers');

function externalHosts(html) {
  const hosts = new Set();
  for (const m of html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) hosts.add(m[1].toLowerCase());
  return [...hosts];
}

for (const { file, spec } of exampleSpecs()) {
  test(`examples/${file}: builds a self-contained file`, () => {
    const html = toolkit.buildHtml(spec);
    assert.ok(html.startsWith('<!doctype html>'));
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), 'unfilled template placeholder');
    assert.ok(html.includes('id="dk-spec"'));
  });

  test(`examples/${file}: only loads from hosts the sandbox allows`, () => {
    const html = toolkit.buildHtml(spec);
    const blocked = externalHosts(html).filter((h) => !config.ALLOWED_HOSTS.includes(h) && h !== 'www.w3.org');
    assert.deepStrictEqual(blocked, []);
  });
}

test('toolkit code never uses eval, new Function, network calls, or innerHTML', () => {
  const files = [path.join(toolkit.ROOT, 'renderer', 'core.js')]
    .concat(Object.values(toolkit.loadWidgets()).map((w) => w.renderFile));
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const banned of ['eval(', 'new Function', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'innerHTML', 'outerHTML', 'document.write']) {
      assert.ok(!source.includes(banned), `${path.relative(toolkit.ROOT, file)} uses ${banned}`);
    }
  }
});

test('charts library is only included when a chart widget is used', () => {
  assert.ok(toolkit.buildHtml(exampleSpecs()[0].spec).includes(config.ECHARTS_URL));
  const kpiOnly = { title: 'KPIs', data_as_of: '2026-10-12T09:00:00-06:00', widgets: [
    { type: 'kpi', id: 'a', title: 'A', value: 1 }, { type: 'kpi', id: 'b', title: 'B', value: 2 },
    { type: 'kpi', id: 'c', title: 'C', value: 3 }, { type: 'kpi', id: 'd', title: 'D', value: 4 }
  ] };
  assert.ok(!toolkit.buildHtml(kpiOnly).includes(config.ECHARTS_URL));
});

test('ECharts version is pinned', () => {
  assert.match(config.ECHARTS_URL, /echarts@\d+\.\d+\.\d+\//);
});

test('spec text cannot break out of the page', () => {
  const hostile = '</script><script>alert(1)</script>{{CORE_JS}}';
  const spec = { title: hostile, data_as_of: '2026-10-12T09:00:00-06:00', widgets: [
    { type: 'table', id: 't', title: hostile, columns: [{ key: 'a', label: 'A' }], rows: [{ a: hostile }] }
  ] };
  const html = toolkit.buildHtml(spec);
  assert.strictEqual(html.split('</script>').length, html.split('<script').length, 'every <script> must have exactly one closing tag');
  assert.ok(!html.includes('<script>alert(1)'));
  assert.ok(html.includes('{{CORE_JS}}'), 'placeholder-like text inside the spec must be left alone');
  assert.ok(html.includes('<title>&lt;/script&gt;'));
});
