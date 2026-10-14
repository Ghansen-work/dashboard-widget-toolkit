'use strict';
/*
  Toolkit library: loads widgets, validates dashboard specs, and assembles the
  final self-contained HTML file. Used by build.js, validate.js, docs.js, and
  the tests.
*/
const fs = require('fs');
const path = require('path');
const { validate } = require('./schema-validate');
const config = require('./config');

const ROOT = path.resolve(__dirname, '..', '..');
const WIDGETS_DIR = path.join(ROOT, 'widgets');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readText = (file) => fs.readFileSync(file, 'utf8');

/*
  Fields every widget shares. They are added to each widget's schema here so
  the anatomy (id, title, subtitle, size, note) is identical across widgets
  and contributors can't drift from it.
*/
function commonProperties(type, meta) {
  const sizes = meta['x-sizes'];
  return {
    type: { type: 'string', const: type, description: `Always "${type}".` },
    id: {
      type: 'string',
      pattern: '^[a-z0-9][a-z0-9-]{0,39}$',
      description: 'Unique id within the dashboard: lowercase letters, numbers, and hyphens, e.g. "open-ar".'
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
      description: 'What the widget shows, in sentence case with no trailing period, e.g. "Revenue by rep, Q3 2026".'
    },
    subtitle: { type: 'string', maxLength: 100, description: 'Optional one line of context under the title: scope, filter, or unit.' },
    size: {
      type: 'string',
      enum: sizes,
      default: meta['x-default-size'],
      description: `Width on the 12-column grid (S = 3, M = 6, L = 9, full = 12). Allowed: ${sizes.join(', ')}.`
    },
    note: { type: 'string', maxLength: 140, description: 'Optional footnote: caveats, definitions, or why data is missing.' }
  };
}

function loadWidgets() {
  const widgets = {};
  for (const type of fs.readdirSync(WIDGETS_DIR).sort()) {
    const dir = path.join(WIDGETS_DIR, type);
    if (type.startsWith('_') || type.startsWith('.') || !fs.statSync(dir).isDirectory()) continue;
    const raw = readJson(path.join(dir, 'schema.json'));
    const schema = Object.assign({}, raw, {
      required: ['type', 'id', 'title'].concat(raw.required || []),
      properties: Object.assign(commonProperties(type, raw), raw.properties || {}),
      additionalProperties: false
    });
    const checksFile = path.join(dir, 'checks.js');
    widgets[type] = {
      type,
      dir,
      raw,
      schema,
      checks: fs.existsSync(checksFile) ? require(checksFile) : null,
      renderFile: path.join(dir, 'render.js'),
      exampleFile: path.join(dir, 'example.json')
    };
  }
  return widgets;
}

function loadDashboardSchema() {
  return readJson(path.join(ROOT, 'schema', 'dashboard.schema.json'));
}

function widgetLabel(widget, index) {
  const id = widget && typeof widget.id === 'string' ? ` "${widget.id}"` : '';
  const type = widget && typeof widget.type === 'string' ? widget.type : 'widget';
  return `widgets[${index}] (${type}${id})`;
}

/*
  Layout check. Widgets fill a 12-column grid left to right in order. Warns
  about rows that end with empty columns and KPIs that share a row with a
  taller widget (the KPI cards would stretch to the chart's height).
*/
function layoutWarnings(spec, widgets) {
  const warnings = [];
  const rows = [];
  let current = { used: 0, items: [] };
  spec.widgets.forEach((w, i) => {
    const size = w.size || widgets[w.type].raw['x-default-size'];
    const cols = config.SIZE_COLUMNS[size];
    if (current.used + cols > 12) {
      rows.push(current);
      current = { used: 0, items: [] };
    }
    current.used += cols;
    current.items.push({ w, i, size });
  });
  rows.push(current);

  rows.forEach((row, r) => {
    const first = row.items[0];
    const where = `Row ${r + 1} (starting at ${widgetLabel(first.w, first.i)})`;
    if (row.used < 12) {
      warnings.push({
        path: `widgets[${first.i}]`,
        message: `${where} fills ${row.used} of 12 columns, leaving a gap. Resize or reorder widgets so each row adds up to 12 (S = 3, M = 6, L = 9, full = 12).`
      });
    }
    const hasKpi = row.items.some((x) => x.w.type === 'kpi');
    const hasOther = row.items.some((x) => x.w.type !== 'kpi');
    if (hasKpi && hasOther) {
      warnings.push({
        path: `widgets[${first.i}]`,
        message: `${where} mixes KPIs with taller widgets, so the KPI cards would stretch. Put KPIs in a row of their own.`
      });
    }
  });
  return warnings;
}

/*
  Validates a dashboard spec. Returns { ok, errors, warnings }, each issue
  being { path, message } with a path that names the widget, e.g.
  widgets[2] (bar_chart "revenue-by-rep").series[0].values
*/
function validateDashboard(spec, widgets = loadWidgets()) {
  const errors = [];
  const warnings = [];
  const available = Object.keys(widgets).join(', ');

  for (const e of validate(spec, loadDashboardSchema(), '')) {
    // Widget entries are validated individually below with better messages.
    if (/^\.widgets\[\d+\]/.test(e.path)) continue;
    errors.push({ path: e.path.replace(/^\./, '') || '(dashboard)', message: e.message });
  }
  if (!spec || typeof spec !== 'object' || !Array.isArray(spec.widgets)) {
    return { ok: false, errors, warnings };
  }

  const ids = new Map();
  spec.widgets.forEach((w, i) => {
    const label = widgetLabel(w, i);
    if (!w || typeof w !== 'object' || Array.isArray(w)) {
      errors.push({ path: `widgets[${i}]`, message: `expected a widget object, got ${JSON.stringify(w)}.` });
      return;
    }
    const definition = widgets[w.type];
    if (!definition) {
      errors.push({
        path: `${label}.type`,
        message: `${JSON.stringify(w.type)} is not a widget in this toolkit. Available widgets: ${available}. Use the closest one, or leave it out and tell the user.`
      });
      return;
    }
    const issues = validate(w, definition.schema, '');
    issues.forEach((e) => errors.push({ path: label + e.path, message: e.message }));
    if (issues.length === 0 && definition.checks) {
      const result = definition.checks(w, { spec });
      (result.errors || []).forEach((e) => errors.push({ path: label + e.path, message: e.message }));
      (result.warnings || []).forEach((e) => warnings.push({ path: label + e.path, message: e.message }));
    }
    if (typeof w.id === 'string') {
      if (ids.has(w.id)) {
        errors.push({ path: `${label}.id`, message: `"${w.id}" is already used by widgets[${ids.get(w.id)}]. Widget ids must be unique.` });
      } else {
        ids.set(w.id, i);
      }
    }
  });

  if (errors.length === 0) warnings.push(...layoutWarnings(spec, widgets));
  return { ok: errors.length === 0, errors, warnings };
}

function formatIssues(result) {
  const lines = [];
  result.errors.forEach((e) => lines.push(`ERROR    ${e.path}: ${e.message}`));
  result.warnings.forEach((w) => lines.push(`WARNING  ${w.path}: ${w.message}`));
  return lines.join('\n');
}

// Fills in defaults so the renderer never has to guess.
function normalize(spec, widgets) {
  const copy = JSON.parse(JSON.stringify(spec));
  copy.currency = copy.currency || 'USD';
  copy.widgets.forEach((w) => {
    w.size = w.size || widgets[w.type].raw['x-default-size'];
  });
  return copy;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// JSON that is safe to place inside a <script> element.
function scriptSafeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// Single pass, so placeholder-like text inside the spec is never expanded.
function fill(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in values ? values[key] : match));
}

/*
  Builds the self-contained HTML file for a spec that has already passed
  validation. Only the widgets the spec uses are included, and ECharts is only
  loaded when a chart widget is present.
*/
function buildHtml(spec, widgets = loadWidgets()) {
  const normalized = normalize(spec, widgets);
  const used = [...new Set(normalized.widgets.map((w) => w.type))].sort();
  const needsCharts = used.some((t) => widgets[t].raw['x-requires-charts']);

  return fill(readText(path.join(ROOT, 'renderer', 'template.html')), {
    TITLE: escapeHtml(normalized.title),
    TOKENS_CSS: readText(path.join(ROOT, 'theme', 'tokens.css')),
    CORE_CSS: readText(path.join(ROOT, 'renderer', 'core.css')),
    LIBRARY_SCRIPTS: needsCharts ? `<script src="${config.ECHARTS_URL}"></script>` : '',
    SPEC_JSON: scriptSafeJson(normalized),
    CORE_JS: readText(path.join(ROOT, 'renderer', 'core.js')),
    WIDGET_JS: used.map((t) => readText(widgets[t].renderFile)).join('\n')
  });
}

module.exports = {
  ROOT,
  WIDGETS_DIR,
  loadWidgets,
  loadDashboardSchema,
  validateDashboard,
  formatIssues,
  buildHtml,
  normalize
};
