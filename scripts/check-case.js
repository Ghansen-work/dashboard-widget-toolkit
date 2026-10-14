#!/usr/bin/env node
'use strict';
/*
  Grades a spec Computer produced against a test case in tests/computer/cases.json.

  Usage:
    node scripts/check-case.js <case-id> <spec.json>
    node scripts/check-case.js --list

  A case passes when the spec validates with no errors or warnings and meets
  every automatic expectation. Manual checks are printed for a person to judge.
*/
const fs = require('fs');
const path = require('path');
const { ROOT, validateDashboard, formatIssues } = require('./lib/toolkit');

const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'computer', 'cases.json'), 'utf8'));

// Reads values at a dotted path; "*" fans out over an array. "columns.*.format" -> ["text", "status"]
function valuesAt(object, field) {
  let values = [object];
  for (const part of field.split('.')) {
    const next = [];
    for (const v of values) {
      if (v === null || v === undefined) continue;
      if (part === '*') { if (Array.isArray(v)) next.push(...v); } else next.push(v[part]);
    }
    values = next;
  }
  return values;
}

function ruleMet(widget, rule) {
  const values = valuesAt(widget, rule.field).map((v) => (v === undefined && 'default' in rule ? rule.default : v));
  if ('equals' in rule) return values.some((v) => v === rule.equals);
  if ('includes' in rule) return values.includes(rule.includes);
  if ('length' in rule) return values.some((v) => Array.isArray(v) && v.length === rule.length);
  return false;
}

function grade(testCase, spec) {
  const results = [];
  const check = (ok, label) => results.push({ ok, label });
  const expect = testCase.expect || {};

  const validation = validateDashboard(spec);
  check(validation.ok, 'spec validates with no errors');
  check(validation.warnings.length === 0, 'spec has no warnings');

  const widgets = Array.isArray(spec.widgets) ? spec.widgets : [];
  const counts = {};
  widgets.forEach((w) => { counts[w.type] = (counts[w.type] || 0) + 1; });

  const needed = {};
  (expect.must_include || []).forEach((t) => { needed[t] = (needed[t] || 0) + 1; });
  for (const [type, n] of Object.entries(needed)) {
    check((counts[type] || 0) >= n, `includes at least ${n} ${type} widget(s) (found ${counts[type] || 0})`);
  }
  for (const type of expect.must_not_include || []) {
    check(!counts[type], `does not include ${type} (found ${counts[type] || 0})`);
  }
  if (expect.max_widgets) check(widgets.length <= expect.max_widgets, `uses at most ${expect.max_widgets} widgets (found ${widgets.length})`);
  for (const rule of expect.has || []) {
    const target = Object.entries(rule).filter(([k]) => !['type', 'field', 'default'].includes(k)).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ');
    check(widgets.some((w) => w.type === rule.type && ruleMet(w, rule)), `a ${rule.type} has ${rule.field} ${target}`);
  }
  return { results, validation };
}

function main(argv) {
  const args = argv.slice(2);
  if (args[0] === '--list' || args.length === 0) {
    cases.forEach((c) => console.log(`${c.id.padEnd(20)} ${c.prompt}`));
    return args.length === 0 ? 1 : 0;
  }
  const [id, specPath] = args;
  const testCase = cases.find((c) => c.id === id);
  if (!testCase) {
    console.error(`No case "${id}". Run with --list to see cases.`);
    return 1;
  }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const { results, validation } = grade(testCase, spec);

  console.log(`Case: ${testCase.id}\nPrompt: ${testCase.prompt}\n`);
  results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}`));
  const issues = formatIssues(validation);
  if (issues) console.log(`\n${issues}`);
  if (testCase.manual_checks && testCase.manual_checks.length) {
    console.log('\nCheck by hand:');
    testCase.manual_checks.forEach((m) => console.log(`  [ ] ${m}`));
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${failed ? `FAILED (${failed} of ${results.length} checks)` : `PASSED (${results.length} checks)`}`);
  return failed ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv);
module.exports = { grade, cases };
