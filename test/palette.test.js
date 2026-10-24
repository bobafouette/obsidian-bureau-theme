'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readTheme, varsFor, contrast } = require('./css');

const css = readTheme();

// The spec's palette table.
const SPEC = {
  'body.theme-dark': {
    '--background-primary': '#0B0B0C',
    '--background-secondary': '#131315',
    '--background-modifier-hover': '#1C1C1F',
    '--background-modifier-border': '#2A2A2E',
    '--text-muted': '#8A8A90',
    '--text-normal': '#D9D9D6',
    '--bureau-strong': '#FFFFFF',
    '--bureau-red': '#E0263A',
    '--bureau-blue': '#5B8DBF',
  },
  'body.theme-light': {
    '--background-primary': '#F2F0EB',
    '--background-secondary': '#E8E5DE',
    '--background-modifier-hover': '#DDD9D0',
    '--background-modifier-border': '#C9C4B8',
    '--text-muted': '#6B675F',
    '--text-normal': '#1A1A1A',
    '--bureau-strong': '#000000',
    '--bureau-red': '#C2182B',
    '--bureau-blue': '#2D5F8F',
  },
};

// Values the implementation had to move away from the spec to meet 4.5:1 contrast.
const NUDGED = { 'body.theme-dark': { '--bureau-red': '#E63D4E' } };

const RED_ROLES = [
  '--link-color', '--link-unresolved-color', '--tag-color', '--caret-color',
  '--interactive-accent', '--text-accent', '--checkbox-color', '--nav-item-color-active',
];
const BLUE_ROLES = ['--link-external-color', '--h2-color'];
const STRONG_ROLES = ['--h1-color', '--h3-color'];

for (const mode of Object.keys(SPEC)) {
  const vars = varsFor(css, mode);

  test(`${mode}: palette matches the spec`, () => {
    for (const [name, value] of Object.entries(SPEC[mode])) {
      const expected = (NUDGED[mode] && NUDGED[mode][name]) || value;
      assert.equal((vars[name] || '').toLowerCase(), expected.toLowerCase(), name);
    }
  });

  test(`${mode}: text roles are readable`, () => {
    const bg = vars['--background-primary'];
    for (const name of ['--text-normal', '--text-muted', '--bureau-red', '--bureau-blue']) {
      const ratio = contrast(vars[name], bg);
      assert.ok(ratio >= 4.5, `${name} ${vars[name]} on ${bg} is ${ratio.toFixed(2)}:1`);
    }
  });

  test(`${mode}: red stays readable on the sidebar (active file name)`, () => {
    const ratio = contrast(vars['--bureau-red'], vars['--background-secondary']);
    assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`);
  });

  test(`${mode}: accent roles`, () => {
    for (const name of RED_ROLES) assert.equal(vars[name], 'var(--bureau-red)', name);
    for (const name of BLUE_ROLES) assert.equal(vars[name], 'var(--bureau-blue)', name);
    for (const name of STRONG_ROLES) assert.equal(vars[name], 'var(--bureau-strong)', name);
  });

  test(`${mode}: accents ignore the user accent setting`, () => {
    for (const name of [...RED_ROLES, ...BLUE_ROLES]) {
      assert.ok(!/--accent-|--color-accent/.test(vars[name] || ''), `${name}: ${vars[name]}`);
    }
  });
}

// Obsidian's app.css sets many variables on .theme-dark/.theme-light and .is-mobile
// (one class). Plain `body` (no class) or a bare mode class loses to those, which
// showed up on mobile as filled tags. Every theme variable sits on body.theme-*.
test('variables are declared on body.theme-dark / body.theme-light', () => {
  const { parseRules, declarations } = require('./css');
  for (const r of parseRules(css)) {
    if (!declarations(r.body).some(([k]) => k.startsWith('--'))) continue;
    for (const sel of r.selector.split(',').map((x) => x.trim())) {
      if (/^(body|\.theme-dark|\.theme-light)$/.test(sel)) assert.fail(`variables on weak selector "${sel}"`);
    }
  }
  const dark = Object.keys(varsFor(css, 'body.theme-dark')).sort();
  const light = Object.keys(varsFor(css, 'body.theme-light')).sort();
  assert.deepEqual(light, dark);
});
