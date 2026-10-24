'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readTheme, stripComments, parseRules, declarations, varsFor } = require('./css');

const css = readTheme();
const rules = parseRules(css);
const body = varsFor(css, 'body');

/** Rules whose selector matches `re`, with their declarations as a map. */
function find(re) {
  return rules.filter((r) => re.test(r.selector)).map((r) => ({
    selector: r.selector,
    decl: Object.fromEntries(declarations(r.body)),
  }));
}

test('fonts', () => {
  assert.equal(body['--font-text-theme'], 'Inter, "Helvetica Neue", Arial, sans-serif');
  assert.equal(body['--font-monospace-theme'], '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace');
  assert.equal(body['--font-interface-theme'], body['--font-text-theme']);
});

test('no rounded corners', () => {
  for (const name of [
    '--radius-s', '--radius-m', '--radius-l', '--radius-xl', '--tag-radius', '--checkbox-radius',
    '--callout-radius', '--code-radius', '--button-radius', '--input-radius', '--modal-radius',
  ]) {
    assert.ok(name in body, `body declares ${name}`);
  }
  for (const r of rules) {
    for (const [k, v] of declarations(r.body)) {
      if (k.startsWith('--') && /radius/.test(k)) assert.match(v, /^0(px)?$/, `${r.selector} ${k}`);
      if (k === 'border-radius') assert.match(v, /^0(px)?$/, `${r.selector} border-radius`);
    }
  }
});

test('no shadows, no motion', () => {
  assert.equal(body['--shadow-s'], 'none');
  assert.equal(body['--shadow-l'], 'none');
  const code = stripComments(css);
  assert.doesNotMatch(code, /@keyframes/);
  for (const r of rules) {
    for (const [k, v] of declarations(r.body)) {
      if (k === 'box-shadow') assert.equal(v, 'none', r.selector);
      assert.ok(!/^(animation|transition)(-|$)/.test(k), `${r.selector} ${k}`);
    }
  }
});

test('headings', () => {
  assert.equal(body['--h1-weight'], '800');
  assert.equal(body['--h2-weight'], '700');
  assert.equal(body['--h3-weight'], '700');

  const h1 = find(/\.markdown-rendered h1\b/).find((r) => r.decl['text-transform']);
  assert.ok(h1, 'an H1 rule sets text-transform');
  assert.match(h1.selector, /\.inline-title/);
  assert.match(h1.selector, /\.HyperMD-header-1/);
  assert.equal(h1.decl['text-transform'], 'uppercase');
  assert.equal(h1.decl['letter-spacing'], '0.08em');

  const h2 = find(/\.markdown-rendered h2\b/).find((r) => r.decl['text-transform']);
  assert.ok(h2, 'an H2 rule sets text-transform');
  assert.match(h2.selector, /\.HyperMD-header-2/);
  assert.equal(h2.decl['text-transform'], 'uppercase');
  assert.equal(h2.decl['letter-spacing'], '0.06em');

  const small = find(/\.markdown-rendered h4\b/).find((r) => r.decl['font-family']);
  assert.ok(small, 'an H4-H6 rule sets font-family');
  for (const h of ['h5', 'h6', 'HyperMD-header-4', 'HyperMD-header-6']) assert.match(small.selector, new RegExp(h));
  assert.equal(small.decl['font-family'], 'var(--font-monospace)');
  assert.equal(small.decl['text-transform'], 'uppercase');
  assert.equal(small.decl.color, 'var(--text-muted)');
});

test('active markers', () => {
  const file = find(/\.nav-file-title\.is-active/).find((r) => r.decl['border-left']);
  assert.ok(file, 'active file rule with a left border');
  assert.equal(file.decl['border-left'], '2px solid var(--bureau-red)');
  assert.equal(file.decl['background-color'], 'transparent');

  const tab = find(/\.workspace-tab-header\.is-active/).find((r) => r.decl['border-top']);
  assert.ok(tab, 'active tab rule with a top border');
  assert.equal(tab.decl['border-top'], '2px solid var(--bureau-red)');
});
