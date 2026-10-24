'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readTheme, stripComments, parseRules, declarations, varsFor, contrast } = require('./css');

const css = readTheme();
const rules = parseRules(css);
const body = varsFor(css, 'body.theme-dark');

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

test('tags are square stamps on every platform', () => {
  for (const mode of ['body.theme-dark', 'body.theme-light']) assert.equal(varsFor(css, mode)['--tag-radius'], '0', mode);
});

test('native corner shapes, except square tabs and sidebar icons on desktop', () => {
  // Obsidian (mobile especially) draws its own rounded UI; square overrides clashed with
  // it. The one exception: on desktop, tabs and the icons at the top of the sidebars.
  const allowed = /^body:not\(\.is-mobile\) (\.workspace-tab-header|\.workspace-tab-header-container|\.nav-header|\.sidebar-toggle-button)\b/;
  let squared = 0;
  for (const r of rules) {
    for (const [k, v] of declarations(r.body)) {
      if (!/radius/.test(k)) continue;
      if (k === '--tag-radius') continue; // square stamps on every platform, checked below
      for (const sel of r.selector.split(',').map((x) => x.trim())) {
        assert.match(sel, allowed, `${sel} sets ${k}`);
      }
      assert.match(v, /^0(px)?$/, `${r.selector} ${k}`);
      squared++;
    }
  }
  assert.ok(squared > 0, 'desktop tabs and sidebar icons are squared');
  const sels = rules.filter((r) => declarations(r.body).some(([k]) => k === 'border-radius')).map((r) => r.selector).join(',');
  for (const s of ['.workspace-tab-header', '.workspace-tab-header-inner', '.workspace-tab-header-container .clickable-icon', '.nav-header .clickable-icon']) {
    assert.ok(sels.includes(`body:not(.is-mobile) ${s}`), `squares ${s}`);
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
  // The active file is marked on the text itself: red, no bar, no fill (mobile
  // draws its own rounded item shapes, a border there turns into an arc).
  assert.equal(body['--nav-item-background-active'], 'transparent');
  const file = find(/\.nav-file-title\.is-active/).find((r) => r.decl.color);
  assert.ok(file, 'active file rule sets color');
  assert.match(file.selector, /\.tree-item-self\.is-active/);
  assert.equal(file.decl.color, 'var(--bureau-red)');
  assert.equal(file.decl['background-color'], 'transparent');
  for (const r of find(/\.nav-file-title\.is-active|\.tree-item-self\.is-active/)) {
    assert.ok(!Object.keys(r.decl).some((k) => k.startsWith('border')), `${r.selector} draws no border`);
  }

  const tab = find(/\.workspace-tab-header\.is-active/).find((r) => r.decl['border-top']);
  assert.ok(tab, 'active tab rule with a top border');
  assert.equal(tab.decl['border-top'], '2px solid var(--bureau-red)');
});

test('H1 sits on a light red tint that ends with the text, still readable', () => {
  const { hexToRgb } = require('./css');
  const h1 = find(/\.markdown-rendered h1\b/).find((r) => r.decl['background-color']);
  assert.ok(h1, 'an H1 rule sets background-color');
  assert.ok(h1.selector.includes('.HyperMD-header-1'), 'editor H1 too');
  assert.ok(!find(/\.inline-title/).some((r) => r.decl['background-color']), 'the note title has no tint');
  assert.equal(h1.decl['background-color'], 'var(--bureau-h1-background)');
  // The tint hugs the text, with room on the left.
  assert.equal(h1.decl.width, 'fit-content');
  assert.equal(h1.decl['padding-left'], '0.6em');

  for (const mode of ['body.theme-dark', 'body.theme-light']) {
    const v = varsFor(css, mode);
    const m = /^rgba\(var\(--bureau-red-rgb\), (0?\.\d+)\)$/.exec(v['--bureau-h1-background'] || '');
    assert.ok(m, `${mode} --bureau-h1-background is a red rgba`);
    const alpha = Number(m[1]);
    assert.ok(alpha > 0 && alpha <= 0.2, `${mode} alpha ${alpha} is light`);
    // Blend the tint over the page and check the heading text on the result.
    const red = v['--bureau-red-rgb'].split(',').map(Number);
    const bg = hexToRgb(v['--background-primary']);
    const mixed = '#' + bg.map((c, i) => Math.round(c * (1 - alpha) + red[i] * alpha).toString(16).padStart(2, '0')).join('');
    const ratio = contrast(v['--bureau-strong'], mixed);
    assert.ok(ratio >= 7, `${mode} H1 text on tint ${mixed} is ${ratio.toFixed(2)}:1`);
  }
});
