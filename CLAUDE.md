# Bureau (Obsidian theme) — project context

## Why this exists
A minimal, futuristic theme for people who like Control's look (Remedy): brutalist,
typographic, restrained. Comfortable for hours of reading and writing, not just a screenshot.

## Design principle (don't drift from it)
- **Mostly black and white.** Concrete greys, hairline rules, square corners, no shadows, no motion.
- **Two accents, one job each.** Red points inside the vault (internal links, tags, cursor,
  active file and tab, checkboxes). Blue points outside it (web links), plus H2. Neither is
  ever a large fill.
- Never neon, glow, glitch, gradients or rounded "app" chrome.
- Every text colour is at least 4.5:1 on its background in both modes.
- Spec: `docs/superpowers/specs/2026-10-24-bureau-theme-design.md`.

## What the theme does (v0.0.1)
- Dark ("the Oldest House") and light ("paper") palettes in `.theme-dark` / `.theme-light`;
  theme tokens `--bureau-strong`, `--bureau-red`, `--bureau-blue` and their `-rgb` forms.
- Title-card headings (H1, inline title, H2 uppercase), H4–H6 monospace labels.
- Properties as a case-file header, tags as stamps, callouts as memos (every built-in type
  remapped to blue, red or grey).
- `==highlights==` are redaction bars in reading view, revealed on hover/tap/focus; readable
  in the editor; underlined in print and PDF export.
- Dark red is `#E43446`, not the spec's `#E0263A` (that one is 4.22:1 on the dark background).

## Technical constraints
- One `theme.css`, no build, no `package.json`, no dependencies, nothing external
  (no `@import`, no remote `url()`, no bundled fonts). `manifest.json` has no `id`, no `versions.json`.
- Accent variables are literal theme tokens, never `--accent-*`, so the user's accent-colour
  setting cannot recolour the theme.

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
