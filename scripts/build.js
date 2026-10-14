#!/usr/bin/env node
'use strict';
/*
  Validate a dashboard spec and build the self-contained HTML file.

  Usage:
    node scripts/build.js <spec.json> [--out dashboard.html] [--check] [--strict]

    --out     Output path. Defaults to the spec's name with .html.
    --check   Validate only; don't write HTML.
    --strict  Treat warnings as errors.

  Exit code 0 = built (or valid with --check), 1 = errors to fix.
*/
const fs = require('fs');
const path = require('path');
const { loadWidgets, validateDashboard, formatIssues, buildHtml } = require('./lib/toolkit');

function main(argv) {
  const args = argv.slice(2);
  let specPath = null;
  let outPath = null;
  let check = false;
  let strict = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--out') outPath = args[++i];
    else if (arg === '--check') check = true;
    else if (arg === '--strict') strict = true;
    else if (!arg.startsWith('--') && !specPath) specPath = arg;
    else {
      console.error(`Unknown argument: ${arg}`);
      return 1;
    }
  }

  if (!specPath) {
    console.error('Usage: node scripts/build.js <spec.json> [--out dashboard.html] [--check] [--strict]');
    return 1;
  }

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (error) {
    console.error(`ERROR    ${specPath} is not valid JSON: ${error.message}`);
    return 1;
  }

  const widgets = loadWidgets();
  const result = validateDashboard(spec, widgets);
  const report = formatIssues(result);
  if (report) console.log(report);

  if (!result.ok) {
    console.log(`\n${result.errors.length} error(s). Fix them and run the build again.`);
    return 1;
  }
  if (strict && result.warnings.length) {
    console.log(`\n${result.warnings.length} warning(s) with --strict. Fix them and run the build again.`);
    return 1;
  }
  if (check) {
    console.log(`Spec is valid${result.warnings.length ? ` with ${result.warnings.length} warning(s)` : ''}.`);
    return 0;
  }

  outPath = outPath || specPath.replace(/\.json$/i, '') + '.html';
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, buildHtml(spec, widgets));
  console.log(`Built ${outPath} (${spec.widgets.length} widgets${result.warnings.length ? `, ${result.warnings.length} warning(s)` : ''}).`);
  return 0;
}

process.exitCode = main(process.argv);
