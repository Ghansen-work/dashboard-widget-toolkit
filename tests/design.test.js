'use strict';
/*
  Unified design guard: colors, fonts, and font sizes live only in
  theme/tokens.css. Everything else must reference the tokens.
*/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { toolkit } = require('./helpers');

const files = [path.join(toolkit.ROOT, 'renderer', 'core.css'), path.join(toolkit.ROOT, 'renderer', 'core.js')]
  .concat(Object.values(toolkit.loadWidgets()).map((w) => w.renderFile));

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

for (const file of files) {
  const name = path.relative(toolkit.ROOT, file);
  const source = strip(fs.readFileSync(file, 'utf8'));

  test(`${name}: no hardcoded colors`, () => {
    const hits = source.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) || [];
    assert.deepStrictEqual(hits, [], 'use a --dk-color-* or --dk-series-* token instead');
  });

  test(`${name}: no hardcoded font families`, () => {
    assert.ok(!/font-family\s*:\s*(?![\s]|var\()/i.test(source), 'use var(--dk-font-sans)');
  });
}

test('renderer CSS uses size tokens for font sizes', () => {
  const css = strip(fs.readFileSync(path.join(toolkit.ROOT, 'renderer', 'core.css'), 'utf8'));
  const literal = css.match(/font-size\s*:\s*(?![\s]|var\()[^;]+/gi) || [];
  assert.deepStrictEqual(literal, []);
});
