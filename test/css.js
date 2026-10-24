// Small, dependency-free CSS helpers for the theme tests.
'use strict';

const fs = require('fs');
const path = require('path');

const THEME = path.resolve(__dirname, '..', 'theme.css');

function readTheme() {
  return fs.readFileSync(THEME, 'utf8');
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Flat list of style rules: { selector, body, media }. `media` is the prelude of the
 * enclosing at-rule (e.g. "@media print"), or '' at top level.
 */
function parseRules(css, media = '') {
  const src = stripComments(css);
  const rules = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open === -1) break;
    const prelude = src.slice(i, open).trim();
    // Find the matching closing brace.
    let depth = 1;
    let j = open + 1;
    while (j < src.length && depth > 0) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') depth--;
      j++;
    }
    const inner = src.slice(open + 1, j - 1);
    if (prelude.startsWith('@')) {
      rules.push(...parseRules(inner, prelude));
    } else {
      rules.push({ selector: prelude.replace(/\s+/g, ' '), body: inner, media });
    }
    i = j;
  }
  return rules;
}

function selectorList(selector) {
  return selector.split(',').map((s) => s.trim());
}

/** Declarations of a rule body as [property, value] pairs, in order. */
function declarations(body) {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const k = d.indexOf(':');
      return [d.slice(0, k).trim(), d.slice(k + 1).trim()];
    });
}

function varsFor(css, selector) {
  const out = {};
  for (const r of parseRules(css)) {
    if (r.media || !selectorList(r.selector).includes(selector)) continue;
    for (const [k, v] of declarations(r.body)) if (k.startsWith('--')) out[k] = v;
  }
  return out;
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function rulesMatching(css, selectorRe) {
  return parseRules(css).filter((r) => selectorRe.test(r.selector)).map((r) => r.body);
}

module.exports = {
  readTheme, stripComments, parseRules, declarations, varsFor, hexToRgb, contrast, rulesMatching,
};
