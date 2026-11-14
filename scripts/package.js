#!/usr/bin/env node
'use strict';
/*
  Zip the skill for upload to DevRev Computer
  (Settings > My Computer > Skills > Upload).

  Usage:
    node scripts/package.js

  Packages the last commit (HEAD), not uncommitted edits, so the zip always
  matches something in Git history. Writes out/dashboard-toolkit.zip with
  everything inside a dashboard-toolkit/ folder, which DevRev requires to
  match the skill's `name`.

  Left out: repo-only files Computer never reads. DevRev's skill guidelines
  also say not to put a README.md at the skill root.
*/
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NAME = 'dashboard-toolkit';
const EXCLUDE = [
  'tests',
  'scripts/check-case.js',
  'README.md',
  'CONTRIBUTING.md',
  'TESTING.md',
  '.gitignore'
];

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

const dirty = git(['status', '--porcelain']).trimEnd();
if (dirty) {
  console.log('WARNING  You have uncommitted changes. The zip contains the last commit only:');
  console.log(dirty.split('\n').map((line) => `         ${line}`).join('\n'));
}

const outDir = path.join(ROOT, 'out');
const outFile = path.join(outDir, `${NAME}.zip`);
fs.mkdirSync(outDir, { recursive: true });
git([
  'archive', '--format=zip', `--prefix=${NAME}/`, '-o', outFile, 'HEAD', '--', '.',
  ...EXCLUDE.map((p) => `:(exclude)${p}`)
]);

const excluded = (file) => EXCLUDE.some((p) => file === p || file.startsWith(`${p}/`));
const files = git(['ls-tree', '-r', '--name-only', 'HEAD']).trim().split('\n').filter((f) => !excluded(f));
if (!files.includes('SKILL.md')) {
  console.error('ERROR    SKILL.md is missing from the package.');
  process.exit(1);
}
const commit = git(['rev-parse', '--short', 'HEAD']).trim();
const kb = Math.round(fs.statSync(outFile).size / 1024);
console.log(`Packaged ${files.length} files from ${commit} into ${path.relative(ROOT, outFile)} (${kb} KB).`);
