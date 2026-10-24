'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { contrast, varsFor, stripComments, hexToRgb } = require('./css');

test('contrast follows WCAG 2.x', () => {
  assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
  const grey = contrast('#777', '#fff');
  assert.ok(grey > 4.47 && grey < 4.49, `got ${grey}`);
});

test('hexToRgb accepts short and long forms', () => {
  assert.deepEqual(hexToRgb('#fff'), [255, 255, 255]);
  assert.deepEqual(hexToRgb('#0B0B0C'), [11, 11, 12]);
});

test('varsFor collects custom properties for an exact selector, later wins', () => {
  assert.deepEqual(
    varsFor('.theme-dark, .x { --a: 1; } .theme-dark { --a: 2; --b: #fff }', '.theme-dark'),
    { '--a': '2', '--b': '#fff' },
  );
  assert.deepEqual(varsFor('.theme-darker { --a: 1 }', '.theme-dark'), {});
});

test('stripComments removes block comments', () => {
  assert.equal(stripComments('a /* x */ b'), 'a  b');
});
