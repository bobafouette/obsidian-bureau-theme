'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readTheme, parseRules, declarations, varsFor } = require('./css');

const css = readTheme();
const rules = parseRules(css);
const body = varsFor(css, 'body.theme-dark');

function find(re, { media = '' } = {}) {
  return rules
    .filter((r) => re.test(r.selector) && (media ? r.media.includes(media) : !r.media))
    .map((r) => ({ selector: r.selector, decl: Object.fromEntries(declarations(r.body)) }));
}

/** First matching rule that declares `prop`. */
function withProp(re, prop, opts) {
  const r = find(re, opts).find((x) => prop in x.decl);
  assert.ok(r, `a rule matching ${re} declares ${prop}`);
  return r;
}

test('tags are stamps', () => {
  assert.equal(body['--tag-background'], 'transparent');
  assert.equal(body['--tag-background-hover'], 'transparent');
  assert.equal(body['--tag-border-width'], '1px');
  assert.equal(body['--tag-border-color'], 'var(--bureau-red)');
  // Stamps must fit inside the line box: no vertical padding, and a fixed size so a
  // tag in a heading does not grow with it.
  assert.equal(body['--tag-padding-y'], '0');
  assert.equal(body['--tag-padding-x'], '0.4em');
  const tag = withProp(/\.tag\b/, 'text-transform');
  assert.match(tag.selector, /\.cm-hashtag/);
  assert.equal(tag.decl['font-size'], 'calc(var(--font-text-size) * 0.75)');
  assert.equal(tag.decl['font-family'], 'var(--font-monospace)');
  assert.equal(tag.decl['text-transform'], 'uppercase');
});

test('properties are a case-file header', () => {
  assert.equal(withProp(/\.metadata-container/, 'border').decl.border, '1px solid var(--background-modifier-border)');
  const key = withProp(/\.metadata-property-key/, 'text-transform');
  assert.equal(key.decl['font-family'], 'var(--font-monospace)');
  assert.equal(key.decl['text-transform'], 'uppercase');
  assert.equal(key.decl.color, 'var(--text-muted)');
});

test('every built-in callout type is remapped to the palette', () => {
  const blue = ['note', 'info'];
  const red = ['warning', 'caution', 'attention', 'danger', 'error', 'bug', 'failure', 'fail', 'missing'];
  const grey = ['todo', 'abstract', 'summary', 'tldr', 'tip', 'hint', 'important', 'success', 'check',
    'done', 'question', 'help', 'faq', 'example', 'quote', 'cite'];
  const expect = (types, value) => {
    for (const t of types) {
      const r = find(new RegExp(`\\[data-callout="${t}"\\]`)).find((x) => '--callout-color' in x.decl);
      assert.ok(r, `callout ${t} is remapped`);
      assert.equal(r.decl['--callout-color'], value, `callout ${t}`);
    }
  };
  expect(blue, 'var(--bureau-blue-rgb)');
  expect(red, 'var(--bureau-red-rgb)');
  expect(grey, 'var(--bureau-grey-rgb)');
  // The base .callout rule covers custom types too.
  assert.equal(withProp(/^\.callout$/, '--callout-color').decl['--callout-color'], 'var(--bureau-grey-rgb)');
  const title = withProp(/\.callout-title\b/, 'text-transform');
  assert.equal(title.decl['font-family'], 'var(--font-monospace)');
  assert.equal(title.decl['text-transform'], 'uppercase');
});

test('redaction in reading view', () => {
  const mark = find(/\.markdown-rendered mark(?!:)/).find((x) => x.decl.color);
  assert.ok(mark, 'reading-view mark rule sets color');
  assert.equal(mark.decl['background-color'], 'var(--bureau-strong)');
  assert.equal(mark.decl.color, 'var(--bureau-strong)');
});

test('redaction reveals on hover, tap and focus', () => {
  const r = find(/\.markdown-rendered mark:hover/).find((x) => x.decl.color);
  assert.ok(r, 'reveal rule');
  for (const s of ['.markdown-rendered mark:hover', '.markdown-rendered mark:active', '.markdown-rendered mark:focus']) {
    assert.ok(r.selector.split(',').map((x) => x.trim()).includes(s), s);
  }
  assert.equal(r.decl.color, 'var(--text-normal)');
  assert.equal(r.decl['background-color'], 'var(--background-modifier-hover)');
});

test('highlights stay readable in the editor', () => {
  assert.equal(body['--text-highlight-bg'], 'var(--background-modifier-hover)');
  for (const r of find(/\.cm-highlight/)) {
    if (r.decl.color && r.decl['background-color']) assert.notEqual(r.decl.color, r.decl['background-color']);
  }
});

test('highlights print readable', () => {
  const r = withProp(/(^|,\s*|\s)mark\b/, 'text-decoration', { media: 'print' });
  assert.equal(r.decl.color, 'inherit');
  assert.equal(r.decl['background-color'], 'transparent');
  assert.equal(r.decl['text-decoration'], 'underline');
});

test('blockquote and rule', () => {
  assert.equal(body['--blockquote-border-thickness'], '2px');
  assert.equal(body['--blockquote-border-color'], 'var(--text-muted)');
  assert.equal(body['--blockquote-font-style'], 'normal');
  assert.equal(body['--blockquote-color'], 'var(--text-muted)');
  const hr = find(/\bhr\b/).find((x) => Object.values(x.decl).some((v) => v.includes('var(--bureau-red)')));
  assert.ok(hr, 'the hr carries a red square');
});

test('graph', () => {
  assert.equal(body['--graph-node'], 'var(--text-muted)');
  assert.equal(body['--graph-node-focused'], 'var(--bureau-red)');
  assert.equal(body['--graph-node-tag'], 'var(--bureau-red)');
  assert.equal(body['--graph-line'], 'var(--background-modifier-border)');
});

test('the cursor is a block', () => {
  // Obsidian draws its editor caret natively; only caret-shape can widen it.
  const caret = withProp(/\.cm-content\b/, 'caret-shape');
  assert.equal(caret.decl['caret-shape'], 'block');
});
