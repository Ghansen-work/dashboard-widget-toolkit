'use strict';
/*
  A small, dependency-free JSON Schema validator.

  It supports only the keywords listed in SUPPORTED, which is all the toolkit
  needs. Keeping it dependency-free means Computer can run the build without
  installing anything. tests/schemas.test.js fails if a schema uses a keyword
  this validator doesn't understand, so nothing is silently ignored.

  Keywords starting with "x-" are toolkit metadata and are ignored here.
*/
const SUPPORTED = new Set([
  '$schema', '$id', 'title', 'description', 'default', 'examples',
  'type', 'const', 'enum', 'required', 'properties', 'additionalProperties',
  'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'minimum', 'maximum',
  'pattern', 'format'
]);

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function matchesType(value, type) {
  const actual = typeOf(value);
  if (type === 'number') return actual === 'number' || actual === 'integer';
  return actual === type;
}

function describe(value) {
  const type = typeOf(value);
  if (type === 'string') return `text ${JSON.stringify(value.length > 40 ? value.slice(0, 40) + '...' : value)}`;
  if (type === 'array') return `a list (${value.length} items)`;
  if (type === 'object') return 'an object';
  if (type === 'null') return 'null';
  return `${type} ${JSON.stringify(value)}`;
}

function validate(value, schema, path = '', errors = []) {
  const add = (message) => errors.push({ path, message });

  if (schema.type !== undefined) {
    const types = [].concat(schema.type);
    if (!types.some((t) => matchesType(value, t))) {
      add(`expected ${types.join(' or ')}, got ${describe(value)}.`);
      return errors;
    }
  }
  if (schema.const !== undefined && value !== schema.const) {
    add(`must be ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}.`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    add(`must be one of ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}; got ${JSON.stringify(value)}.`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) add(`must be at least ${schema.minLength} characters.`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) add(`must be at most ${schema.maxLength} characters (got ${value.length}).`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) add(`${JSON.stringify(value)} doesn't match the required pattern ${schema.pattern}.`);
    if (schema.format === 'date-time' && (!DATE_TIME.test(value) || isNaN(Date.parse(value)))) {
      add(`must be an ISO 8601 timestamp with an offset, e.g. "2026-10-12T09:14:00-06:00"; got ${JSON.stringify(value)}.`);
    }
    if (schema.format === 'date' && !DATE.test(value)) add(`must be a date as "YYYY-MM-DD"; got ${JSON.stringify(value)}.`);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) add('must be a finite number.');
    if (schema.minimum !== undefined && value < schema.minimum) add(`must be at least ${schema.minimum}.`);
    if (schema.maximum !== undefined && value > schema.maximum) add(`must be at most ${schema.maximum}.`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) add(`needs at least ${schema.minItems} items (got ${value.length}).`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) add(`allows at most ${schema.maxItems} items (got ${value.length}).`);
    if (schema.items) value.forEach((item, i) => validate(item, schema.items, `${path}[${i}]`, errors));
  }

  if (typeOf(value) === 'object') {
    const properties = schema.properties || {};
    for (const key of schema.required || []) {
      if (!(key in value)) add(`is missing required field "${key}".`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) {
        validate(child, properties[key], `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({
          path: `${path}.${key}`,
          message: `is not an allowed field. Allowed fields: ${Object.keys(properties).join(', ')}.`
        });
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        validate(child, schema.additionalProperties, `${path}.${key}`, errors);
      }
    }
  }

  return errors;
}

// Returns keywords in a schema (recursively) that this validator doesn't support.
function unsupportedKeywords(schema, path = '', found = []) {
  if (!schema || typeof schema !== 'object') return found;
  for (const [key, child] of Object.entries(schema)) {
    if (key.startsWith('x-')) continue;
    if (!SUPPORTED.has(key)) found.push(`${path}/${key}`);
    if (key === 'properties') {
      for (const [name, sub] of Object.entries(child)) unsupportedKeywords(sub, `${path}/properties/${name}`, found);
    } else if (key === 'items' || (key === 'additionalProperties' && typeof child === 'object')) {
      unsupportedKeywords(child, `${path}/${key}`, found);
    }
  }
  return found;
}

module.exports = { validate, unsupportedKeywords, SUPPORTED };
