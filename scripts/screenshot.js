#!/usr/bin/env node
// Render preview/sample.html with theme.css in both modes.
// Needs Playwright with Chromium (not a repo dependency; run locally, not in CI).
// Usage: node scripts/screenshot.js
// Writes preview/dark.png, preview/light.png and screenshot.png (512x288, dark).
'use strict';

const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'preview', 'sample.html');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const mode of ['dark', 'light']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 1060 } });
      await page.goto(`${PAGE}?mode=${mode}`);
      await page.screenshot({ path: path.join(ROOT, 'preview', `${mode}.png`) });
      await page.close();
    }
    // Obsidian's theme gallery expects 512x288: render 1280x720 at 0.4 scale.
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 0.4 });
    await page.goto(`${PAGE}?mode=dark`);
    await page.screenshot({ path: path.join(ROOT, 'screenshot.png') });
    console.log('Wrote preview/dark.png, preview/light.png, screenshot.png');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
