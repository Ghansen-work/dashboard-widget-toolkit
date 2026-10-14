'use strict';
const fs = require('fs');
const path = require('path');
const toolkit = require('../scripts/lib/toolkit');

const FIXTURES = path.join(__dirname, 'fixtures');

// Wraps fixture widgets in a minimal valid dashboard unless the fixture provides a full spec.
function fixtureSpec(fixture) {
  if (fixture.spec) return fixture.spec;
  return { title: 'Fixture', data_as_of: '2026-10-12T09:00:00-06:00', widgets: fixture.widgets };
}

function loadFixtures() {
  return fs.readdirSync(FIXTURES)
    .filter((f) => f.endsWith('.json'))
    .map((f) => Object.assign({ file: f }, JSON.parse(fs.readFileSync(path.join(FIXTURES, f), 'utf8'))));
}

function exampleSpecs() {
  const dir = path.join(toolkit.ROOT, 'examples');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: f, spec: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }));
}

module.exports = { toolkit, fixtureSpec, loadFixtures, exampleSpecs };
