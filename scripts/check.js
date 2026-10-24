#!/usr/bin/env node
// Repository checks for the Bureau theme. Dependency-free, CommonJS, Node 22.
// Adapted from the fzf family's scripts/check.js for a theme (theme.css, no main.js).
// Usage: node scripts/check.js   (exits 1 if any check fails)
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEMVER = /^\d+\.\d+\.\d+$/;

// ---------------------------------------------------------------- helpers

function readJson(rel, errors) {
  const file = path.join(ROOT, rel);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    errors.push(`${rel}: cannot read (${e.code || e.message})`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    errors.push(`${rel}: invalid JSON (${e.message})`);
    return null;
  }
}

// ---------------------------------------------------------------- checks

/** a. theme.css is well formed and self-contained. */
function checkCss() {
  const errors = [];
  let css;
  try {
    css = fs.readFileSync(path.join(ROOT, 'theme.css'), 'utf8');
  } catch (e) {
    return [`theme.css: cannot read (${e.code || e.message})`];
  }
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\/\*/.test(code)) errors.push('theme.css: unterminated comment');
  let depth = 0;
  code.split(/\r?\n/).forEach((line, i) => {
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}' && --depth < 0) {
        errors.push(`theme.css:${i + 1}: unexpected "}"`);
        depth = 0;
      }
    }
    if (/@import\b/.test(line)) errors.push(`theme.css:${i + 1}: @import (the theme must load nothing external)`);
    if (/url\(\s*['"]?\s*(https?:)?\/\//i.test(line)) {
      errors.push(`theme.css:${i + 1}: external url() (the theme must load nothing external)`);
    }
  });
  if (depth > 0) errors.push(`theme.css: ${depth} unclosed "{"`);
  return errors;
}

/** b. manifest.json is a publishable theme manifest. */
function checkManifest() {
  const errors = [];
  const m = readJson('manifest.json', errors);
  if (!m) return errors;
  for (const k of ['name', 'version', 'minAppVersion', 'author']) {
    if (typeof m[k] !== 'string' || !m[k].trim()) errors.push(`manifest.json: field "${k}" must be a non-empty string`);
  }
  for (const k of ['version', 'minAppVersion']) {
    if (typeof m[k] === 'string' && !SEMVER.test(m[k])) {
      errors.push(`manifest.json: ${k} "${m[k]}" is not strict semver X.Y.Z`);
    }
  }
  if ('id' in m) errors.push('manifest.json: themes have no "id" (that is a plugin field)');
  return errors;
}

/** c. CI and release workflows are present. */
function checkWorkflows() {
  const dir = path.join(ROOT, '.github', 'workflows');
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
  } catch {
    // reported below
  }
  return files.length ? [] : ['.github/workflows: no workflow files'];
}

// ---------------------------------------------------------------- runner

const CHECKS = [
  ['theme.css', checkCss],
  ['Manifest', checkManifest],
  ['Workflows', checkWorkflows],
];

let failed = 0;
for (const [name, fn] of CHECKS) {
  let errors;
  try {
    errors = fn();
  } catch (e) {
    errors = [`check crashed: ${e.message}`];
  }
  if (errors.length) {
    failed++;
    console.log(`✖ ${name}`);
    for (const e of errors) console.log(`    ${e.replace(/\n/g, '\n    ')}`);
  } else {
    console.log(`✔ ${name}`);
  }
}

if (failed) {
  console.log(`\n${failed} of ${CHECKS.length} checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${CHECKS.length} checks passed.`);
