# Bureau (Obsidian theme) — project context

## Why this exists
A minimal, futuristic theme for people who like Control's look (Remedy): brutalist,
typographic, restrained. Comfortable for hours of reading and writing, not just a screenshot.

## Design principle (don't drift from it)
- **Mostly black and white.** Concrete greys, hairline rules, no shadows, no motion.
- **Native shapes.** The theme sets no corner radii (a test enforces it): Obsidian's rounded UI,
  on mobile especially, clashed with square overrides. Exceptions: tags are square stamps
  everywhere (`--tag-radius: 0`); on desktop only (`body:not(.is-mobile)`), tabs and the icons
  at the top of the sidebars are square.
- **Two accents, one job each.** Red points inside the vault (internal links, tags, cursor,
  active file and tab, checkboxes). Blue points outside it (web links), plus H2. Neither is
  a large fill, with one deliberate exception: a light red tint behind H1 (not the note title).
- Never neon, glow, glitch or gradients.
- Every text colour is at least 4.5:1 on its background in both modes.
- Spec: `docs/superpowers/specs/2026-10-24-bureau-theme-design.md`.

## What the theme does (v0.0.1)
- Dark ("the Oldest House") and light ("paper") palettes in `body.theme-dark` / `body.theme-light`;
  theme tokens `--bureau-strong`, `--bureau-red`, `--bureau-blue` and their `-rgb` forms.
- Title-card headings (H1, inline title, H2 uppercase), H4–H6 monospace labels. H1 sits on
  `--bureau-h1-background` (red at 14% dark / 10% light), as wide as its text, 0.6em padding.
- Properties as a case-file header, tags as stamps, callouts as memos (every built-in type
  remapped to blue, red or grey).
- `==highlights==` are redaction bars in reading view, revealed on hover/tap/focus; readable
  in the editor; underlined in print and PDF export.
- Dark red is `#E63D4E`, not the spec's `#E0263A` (that one is 4.22:1 on the dark background;
  `#E63D4E` reaches 4.5:1 on the sidebar too, where the active file name is red).
- Active file: the name turns red (no bar, no fill: on mobile a border became a rounded arc).
- Tags have no vertical padding and a fixed size, so stamps never overlap the lines around them.

## Technical constraints
- One `theme.css`, no build, no `package.json`, no dependencies, nothing external
  (no `@import`, no remote `url()`, no bundled fonts). `manifest.json` has no `id`, no `versions.json`.
- Accent variables are literal theme tokens, never `--accent-*`, so the user's accent-colour
  setting cannot recolour the theme.
- Every variable is declared on `body.theme-dark` / `body.theme-light` (a test enforces it):
  Obsidian sets its own on `.theme-dark` and `.is-mobile`, which beat a plain `body` selector.

## Tests, CI, release
- `node --test 'test/*.test.js'` parses `theme.css` (`test/css.js`) and asserts the spec;
  `node scripts/check.js` checks the CSS is well formed and self-contained and the manifest is valid.
- `node scripts/screenshot.js` (local only, Playwright) renders `preview/sample.html`, a mock of
  Obsidian's DOM styled by `preview/obsidian-base.css`, into `preview/*.png` and `screenshot.png`.
  Re-run it after visual changes.
- CI and release are adapted from `bobafouette/obsidian-fzf-template`: tag `X.Y.Z` (no `v`) or
  publish a release; `release.yml` sets the version and attaches `theme.css` and `manifest.json` (BRAT).
  They are not part of the fzf family's shared files.

## Status / known gaps
- Not yet tested inside real Obsidian; the preview is a mock. Verify there first.
- Selectors for the active file (`.nav-file-title`, `.tree-item-self`) and tab
  (`.workspace-tab-header`) follow Obsidian 1.4+; check them on new Obsidian versions.
