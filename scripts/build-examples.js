#!/usr/bin/env node
'use strict';
// Builds every examples/*.json into out/*.html for previewing.
const fs = require('fs');
const path = require('path');
const { ROOT, loadWidgets, validateDashboard, formatIssues, buildHtml } = require('./lib/toolkit');

const widgets = loadWidgets();
const outDir = path.join(ROOT, 'out');
fs.mkdirSync(outDir, { recursive: true });
let failed = 0;
for (const file of fs.readdirSync(path.join(ROOT, 'examples')).filter((f) => f.endsWith('.json'))) {
  const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', file), 'utf8'));
  const result = validateDashboard(spec, widgets);
  if (!result.ok) {
    failed++;
    console.log(`${file}\n${formatIssues(result)}\n`);
    continue;
  }
  const out = path.join(outDir, file.replace(/\.json$/, '.html'));
  fs.writeFileSync(out, buildHtml(spec, widgets));
  console.log(`Built out/${path.basename(out)}${result.warnings.length ? `\n${formatIssues(result)}` : ''}`);
}
process.exitCode = failed ? 1 : 0;
