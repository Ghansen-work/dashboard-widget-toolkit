'use strict';
// Widget docs are generated from schemas; this fails if someone forgot `npm run docs`.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { expectedDocs } = require('../scripts/docs');

test('generated widget docs are up to date', () => {
  for (const [file, content] of Object.entries(expectedDocs())) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    assert.ok(current === content, `${path.relative(process.cwd(), file)} is out of date. Run \`npm run docs\`.`);
  }
});
