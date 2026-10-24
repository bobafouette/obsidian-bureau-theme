# Bureau Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Bureau Obsidian theme (dark + light) with tests, CI and a tag-driven release, following the fzf family's repo conventions.

**Architecture:** One `theme.css` that sets Obsidian's CSS variables per mode (`.theme-dark`, `.theme-light`) and adds a small number of selectors for what variables cannot express (uppercase headings, stamps, redaction). Dependency-free Node tests parse `theme.css` and assert the spec's rules (contrast, accent roles, no radius/shadow/animation). CI and release mirror `obsidian-fzf-template`, adapted to a theme (files `theme.css` + `manifest.json`, no `versions.json`).

**Tech Stack:** CSS, Node 22 (`node --test`, no `package.json`, no dependencies), GitHub Actions, Playwright (pre-installed, used locally only for the preview screenshot).

**Spec:** `docs/superpowers/specs/2026-10-24-bureau-theme-design.md`

## Global Constraints

- No dependencies, no `package.json`, no build step; CommonJS scripts, Node 22.
- `manifest.json`: `name` `Bureau`, `minAppVersion` `1.4.0`, `author` `bobafouette`, `authorUrl` `https://github.com/bobafouette`, strict `X.Y.Z` `version` starting at `0.0.1`.
- Tags are `X.Y.Z` with no `v`; the tag is the source of truth for `manifest.json` version.
- `theme.css` loads nothing external: no `@import`, no `url(http...)`, no fonts.
- Border radius 0 everywhere, no box shadows, no `@keyframes`/`animation`.
- Red marks things inside the vault, blue things outside it, plus H2. Neither is a large fill.
- Every text role (normal, muted, red, blue) is at least 4.5:1 against `--background-primary` in both modes. Hex values from the spec may be nudged to reach it; the change is noted in the commit message.
- Do not touch the fzf plugin repos. CI and release files are adapted copies, not family-shared files.

## Review Focus

1. **Redacted highlights while editing**: a highlight on the line being edited (live preview) or in source mode must stay readable. Pinned in Task 4 (`highlights stay readable in the editor`).
2. **PDF export / print**: no hover exists on paper, so redaction would black out text in exports; in `@media print` highlights must print readable. Pinned in Task 4 (`highlights print readable`).
3. **Mobile has no hover**: reveal also on `:active` and `:focus` so a tap shows the text. Pinned in Task 4 (`redaction reveals on hover, tap and focus`).
4. **The user's own accent-colour setting**: Obsidian injects `--accent-h/s/l` from Settings; the theme must still be red. `--interactive-accent`, `--text-accent` and `--link-color` must be literal values, not `var(--accent-*)`/`var(--color-accent*)`. Pinned in Task 2 (`accents ignore the user accent setting`).
5. **Rainbow callouts**: callout types not in the spec's list (`tip`, `success`, `question`, `example`, `quote`, `abstract`, `todo`, `failure`) must still be grey, not Obsidian's defaults. Pinned in Task 4 (`every built-in callout type is remapped to the palette`).

---

### Task 1: Repository scaffolding, checks and CI

**Files:**
- Create: `manifest.json`, `.gitignore` (copy of the template's minus the `data.json` lines), `theme.css` (header comment only), `scripts/check.js`, `scripts/bump-version.js`, `.github/workflows/ci.yml`, `test/css.js`, `test/css.test.js`

**Interfaces:**
- Produces, in `test/css.js` (CommonJS):
  - `readTheme(): string` — contents of `theme.css`.
  - `stripComments(css: string): string`.
  - `varsFor(css: string, selector: string): Record<string, string>` — custom properties (`--x: value`) declared in every rule whose selector list contains `selector` exactly (e.g. `.theme-dark`), later declarations winning.
  - `hexToRgb(hex: string): [number, number, number]` (accepts `#rgb` and `#rrggbb`).
  - `contrast(hexA: string, hexB: string): number` — WCAG 2.x contrast ratio.
  - `rulesMatching(css: string, selectorRe: RegExp): string[]` — declaration bodies of rules whose selector text matches.
- Produces `scripts/check.js` checks: theme.css braces balance and it contains no `@import` / external `url(`; manifest fields `name`, `version`, `minAppVersion`, `author` non-empty strings, `version` and `minAppVersion` strict `X.Y.Z`; no `id`; `.github/workflows/*.yml` present. Same runner/output shape as the template's `check.js`.
- Produces `scripts/bump-version.js <version> [minAppVersion]`: template's script minus `versions.json`.

- [ ] **Step 1: Write the failing tests** in `test/css.test.js`:
  - `contrast('#000000', '#ffffff')` rounds to `21`; `contrast('#777', '#fff')` is between `4.47` and `4.49`.
  - `varsFor('.theme-dark, .x { --a: 1; } .theme-dark { --a: 2; --b: #fff }', '.theme-dark')` deep-equals `{ '--a': '2', '--b': '#fff' }`.
  - `varsFor('.theme-darker { --a: 1 }', '.theme-dark')` deep-equals `{}`.
  - `stripComments('a /* x */ b')` equals `'a  b'`.
- [ ] **Step 2: Run** `node --test 'test/*.test.js'` — Expected: FAIL (`Cannot find module './css'`).
- [ ] **Step 3: Implement** `test/css.js`, then `manifest.json`, `.gitignore`, `theme.css` header (`/* Bureau — an Obsidian theme inspired by Control. */`), `scripts/check.js`, `scripts/bump-version.js`, `ci.yml` (template's, unchanged).
- [ ] **Step 4: Run** `node --test 'test/*.test.js' && node scripts/check.js` — Expected: all pass, check prints every check OK.
- [ ] **Step 5: Commit** `Scaffold theme repo: manifest, checks, CSS test helpers, CI`.

### Task 2: Palette and accent roles

**Files:**
- Modify: `theme.css` (two blocks: `.theme-dark` and `.theme-light`)
- Test: `test/palette.test.js`

**Interfaces:**
- Consumes: `readTheme`, `varsFor`, `contrast` from Task 1.
- Produces: per mode, the Obsidian variables later tasks reference — `--background-primary`, `--background-secondary`, `--background-modifier-hover`, `--background-modifier-border`, `--text-normal`, `--text-muted`, `--text-faint`, plus theme tokens `--bureau-strong`, `--bureau-red`, `--bureau-blue`, `--bureau-red-rgb`, `--bureau-blue-rgb`, `--bureau-grey-rgb` (comma-separated `r, g, b` for callouts).

- [ ] **Step 1: Write the failing tests** (each runs for both `.theme-dark` and `.theme-light`):
  - `palette matches the spec`: `--background-primary`, `--background-secondary`, `--background-modifier-hover` (Ink 0/1/2), `--background-modifier-border` (Rule), `--text-muted`, `--text-normal`, `--bureau-strong`, `--bureau-red`, `--bureau-blue` equal the spec table, case-insensitive, except values listed in a `NUDGED` map at the top of the test (empty unless Step 4 forces a nudge).
  - `text roles are readable`: `contrast(x, --background-primary) >= 4.5` for `--text-normal`, `--text-muted`, `--bureau-red`, `--bureau-blue`.
  - `accent roles`: `--link-color`, `--link-unresolved-color`, `--tag-color`, `--caret-color`, `--interactive-accent`, `--text-accent`, `--checkbox-color`, `--nav-item-color-active` are `var(--bureau-red)`; `--link-external-color` and `--h2-color` are `var(--bureau-blue)`; `--h1-color` and `--h3-color` are `var(--bureau-strong)`.
  - `accents ignore the user accent setting`: none of the accent-role values above contains `--accent-` or `--color-accent`.
- [ ] **Step 2: Run** `node --test test/palette.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** both blocks. Also set `--text-selection` to `rgba(var(--bureau-red-rgb), 0.25)`, `--text-on-accent` to Ink 0 in dark and `#fff` in light, and `--text-faint` to `--text-muted`'s value.
- [ ] **Step 4: Run** the tests — Expected: PASS. If a contrast fails, nudge that hex minimally (lightness only), record it in `NUDGED` and in the commit message.
- [ ] **Step 5: Commit** `Add Bureau palette: concrete greys, red inside the vault, blue outside`.

### Task 3: Typography and structure

**Files:**
- Modify: `theme.css` (a `body` block and heading / workspace selectors)
- Test: `test/structure.test.js`

**Interfaces:**
- Consumes: Task 2 tokens.

- [ ] **Step 1: Write the failing tests:**
  - `fonts`: `body` vars `--font-text-theme` equals `Inter, "Helvetica Neue", Arial, sans-serif` and `--font-monospace-theme` equals `"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace`; `--font-interface-theme` equals `--font-text-theme`'s value.
  - `no rounded corners`: every `--*radius*` custom property declared anywhere is `0`/`0px`, the body block declares at least `--radius-s`, `--radius-m`, `--radius-l`, `--radius-xl`, `--tag-radius`, `--checkbox-radius`, `--callout-radius`, `--code-radius`, `--button-radius`, `--input-radius`, `--modal-radius`, and any literal `border-radius:` is `0`.
  - `no shadows, no motion`: `--shadow-s` and `--shadow-l` are `none`; no `box-shadow:` other than `none`; no `@keyframes`, no `animation`, no `transition` properties.
  - `headings`: `--h1-weight` `800`, `--h2-weight` `700`, `--h3-weight` `700`; a rule matching `/\.markdown-rendered h1/` also lists `.inline-title` and `.HyperMD-header-1` and declares `text-transform: uppercase` and `letter-spacing: 0.08em`; the H2 equivalent declares `uppercase` and `0.06em`; a rule covering `h4`–`h6` declares `font-family: var(--font-monospace)` and `text-transform: uppercase` and `color: var(--text-muted)`.
  - `active markers`: a rule matching `/\.nav-file-title\.is-active/` declares a `2px` left border in `var(--bureau-red)` and `background-color: transparent`; a rule matching `/\.workspace-tab-header\.is-active/` declares a `2px` top border in `var(--bureau-red)`.
- [ ] **Step 2: Run** `node --test test/structure.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement.** H1 also gets `border-bottom: 1px solid var(--background-modifier-border)` in reading view and inline title; status bar uses `font-family: var(--font-monospace)`.
- [ ] **Step 4: Run** `node --test 'test/*.test.js' && node scripts/check.js` — Expected: PASS.
- [ ] **Step 5: Commit** `Add title-card typography and brutalist structure`.

### Task 4: Bureau details

**Files:**
- Modify: `theme.css`
- Test: `test/details.test.js`

**Interfaces:**
- Consumes: Task 2 tokens (`--bureau-*-rgb` for callouts).

- [ ] **Step 1: Write the failing tests:**
  - `tags are stamps`: body vars `--tag-background` `transparent`, `--tag-background-hover` `transparent`, `--tag-border-width` `1px`, `--tag-border-color` `var(--bureau-red)`; a rule matching `/\.tag/` declares `font-family: var(--font-monospace)` and `text-transform: uppercase`.
  - `properties are a case-file header`: a rule matching `/\.metadata-container/` declares a `1px solid var(--background-modifier-border)` border; a rule matching `/\.metadata-property-key/` declares monospace, uppercase, `var(--text-muted)`.
  - `every built-in callout type is remapped to the palette`: for each of `note info todo abstract summary tldr tip hint important success check done question help faq warning caution attention failure fail missing danger error bug example quote cite`, some rule matching `[data-callout="<type>"]` sets `--callout-color` to one of `var(--bureau-blue-rgb)`, `var(--bureau-red-rgb)`, `var(--bureau-grey-rgb)`; `note`/`info` → blue, `warning`/`caution`/`attention`/`danger`/`error`/`bug`/`failure`/`fail`/`missing` → red, all others grey. A rule matching `/\.callout-title/` declares monospace and uppercase.
  - `redaction in reading view`: a rule matching `/\.markdown-rendered mark/` sets `background-color` and `color` both to `var(--bureau-strong)`.
  - `redaction reveals on hover, tap and focus`: a rule whose selector list contains `.markdown-rendered mark:hover`, `.markdown-rendered mark:active` and `.markdown-rendered mark:focus` sets `color: var(--text-normal)` and `background-color: var(--background-modifier-hover)`.
  - `highlights stay readable in the editor`: no rule matching `/\.cm-highlight/` sets `color` equal to its `background-color`; `--text-highlight-bg` is `var(--background-modifier-hover)` in `body`.
  - `highlights print readable`: inside `@media print`, a rule for `mark` sets `color: inherit` and `background-color: transparent` and `text-decoration: underline`.
  - `blockquote and rule`: body vars `--blockquote-border-thickness` `2px`, `--blockquote-border-color` `var(--text-muted)`, `--blockquote-font-style` `normal`, `--blockquote-color` `var(--text-muted)`; a rule matching `/\bhr\b/` uses `var(--bureau-red)` (the centre square).
  - `graph`: body vars `--graph-node` `var(--text-muted)`, `--graph-node-focused` and `--graph-node-tag` `var(--bureau-red)`, `--graph-line` `var(--background-modifier-border)`.
- [ ] **Step 2: Run** `node --test test/details.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement.** The hr square: `hr` gets `overflow: visible; position: relative` and an `::after` 6×6px `var(--bureau-red)` square centred on the line.
- [ ] **Step 4: Run** `node --test 'test/*.test.js' && node scripts/check.js` — Expected: PASS.
- [ ] **Step 5: Commit** `Add Bureau details: stamps, case-file properties, memos, redaction`.

### Task 5: Preview, screenshot and README

**Files:**
- Create: `preview/sample.html` (static mock of Obsidian's DOM: ribbon, file explorer with an active file, tab header, reading view with inline title, H1–H6, paragraph with internal / unresolved / external links, tags, properties block, callouts note/warning/tip, blockquote, hr, `mark`, code block, task list; `<link rel="stylesheet" href="../theme.css">`; `body` class set by `?mode=dark|light`, defaulting to dark), `scripts/screenshot.js`, `screenshot.png`, `README.md`

**Interfaces:**
- `node scripts/screenshot.js` — uses the pre-installed `playwright` (`require('playwright')`), loads `preview/sample.html?mode=dark` and `?mode=light` at 1280×800, writes `preview/dark.png`, `preview/light.png`, and `screenshot.png` (the dark one, 512×288 as Obsidian's theme gallery expects). Not run in CI.

- [ ] **Step 1: Build** `sample.html` and `screenshot.js`.
- [ ] **Step 2: Run** `node scripts/screenshot.js` — Expected: three PNGs written. Look at both modes: red appears only on the active file, active tab, internal links, tags, hr square, warning callout; blue only on H2, the external link and note callout; no rounded corners.
- [ ] **Step 3: Write README**: what it is (one paragraph), the colour rule, install (manual into `.obsidian/themes/Bureau/` with `theme.css` + `manifest.json`; BRAT "Add a beta theme" with the repo URL), the redaction behaviour (and that print/export shows highlights underlined), release steps (copied from the template's README, adapted), "not yet tested inside real Obsidian".
- [ ] **Step 4: Run** `node --test 'test/*.test.js' && node scripts/check.js` — Expected: PASS.
- [ ] **Step 5: Commit** `Add preview page, screenshots and README`.

### Task 6: Release workflow and first push

**Files:**
- Create: `.github/workflows/release.yml`, `CLAUDE.md` (project context in the family's style: why, design principle, what it does, constraints, tests/CI/release, known gaps)

**Interfaces:**
- `release.yml`: template's, with the version step writing `manifest.json` only (no `versions.json`), and attaching `theme.css manifest.json` instead of `main.js manifest.json styles.css`.

- [ ] **Step 1: Write** `release.yml` and `CLAUDE.md`.
- [ ] **Step 2: Verify** the version step locally: run its `node -e` body with `TAG=0.0.2` against a scratch copy of `manifest.json` — Expected: version becomes `0.0.2`; with `TAG=v0.0.2` — Expected: exit 1.
- [ ] **Step 3: Run** `node --test 'test/*.test.js' && node scripts/check.js` — Expected: PASS.
- [ ] **Step 4: Commit** `Add release workflow and project context`, then `git push -u origin main` and confirm CI is green on GitHub. Tagging `0.0.1` is left to the user.
