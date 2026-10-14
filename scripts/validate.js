#!/usr/bin/env node
'use strict';
// Validate a spec without building. Same as: node scripts/build.js <spec.json> --check
process.argv.push('--check');
require('./build.js');
