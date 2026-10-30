# Bureau — Obsidian theme design

## Intent
A minimal, futuristic Obsidian theme inspired by Control (Remedy): brutalist, typographic,
restrained. It has to be comfortable for hours of daily reading and writing, not only good in a
screenshot. Explicitly not neon, glow, glitch or gradients.

Success: it feels like the Federal Bureau of Control at a glance, and after a week of use
nothing about it is tiring or distracting.

## Deliverable
- `theme.css`, `manifest.json` (name `Bureau`, `minAppVersion` 1.4.0), `README.md`, `screenshot.png`.
- Installed by hand (`.obsidian/themes/Bureau/`) or via BRAT. No Style Settings dependency,
  no bundled fonts, no JavaScript.
- Works in dark and light mode, desktop and mobile.

## Palette
Mostly black and white. Two accents, each with one job:

| Role | Dark mode | Light mode | Used for |
|---|---|---|---|
| Ink 0 (background) | `#0B0B0C` | `#F2F0EB` (paper) | editor background |
| Ink 1 (surface) | `#131315` | `#E8E5DE` | sidebars, ribbon, status bar |
| Ink 2 (raised) | `#1C1C1F` | `#DDD9D0` | hover, selected rows, code blocks |
| Rule | `#2A2A2E` | `#C9C4B8` | hairline borders |
| Text muted | `#8A8A90` | `#6B675F` | metadata, faint text |
| Text normal | `#D9D9D6` | `#1A1A1A` | body |
| Text strong | `#FFFFFF` | `#000000` | H1, bold |
| **Red** (the Bureau) | `#E0263A` | `#C2182B` | internal `[[links]]`, tags, cursor, active file, checkboxes |
| **Blue** (the outside world) | `#5B8DBF` | `#2D5F8F` | H2 headings, external web links |

Rule of thumb: **red points inside the vault, blue points outside it** (plus one heading level).
Neither accent is used as a large fill; red is at most a 2px bar or a stamp border, with one
deliberate exception added later: a light red tint behind H1 (not the note title). Exact
hex values may be nudged during implementation to keep body-text contrast at least 4.5:1
(WCAG AA) on its background.

## Typography
Font stacks (all overridable through Obsidian's own font settings):
- Body: `Inter, "Helvetica Neue", Arial, sans-serif`.
- Headings: same family, heavy weight.
- Metadata and code: `"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace`.

Heading ladder (the title-card look):
- H1: uppercase, weight 800, letter-spacing 0.08em, text strong, a 1px rule below, on a light
  red tint (`rgba(red, 0.14)` dark, `0.1` light; heading text stays at least 7:1) that is as
  wide as the text, with 0.6em padding each side. The inline title has no tint.
- H2: uppercase, weight 700, letter-spacing 0.06em, **blue**.
- H3: weight 700, text strong, normal case.
- H4–H6: monospace, uppercase, small, muted (they read as file labels).
- Inline title: same as H1.

## Structure
- Corner shapes are Obsidian's own: the theme sets no radius. (Changed after mobile testing:
  square overrides clashed with the app's rounded mobile UI. Originally: radius 0 everywhere.)
  Exceptions: tags are square stamps on every platform; desktop only: tabs (without the active tab's curved feet) and the icons at the
  top of the sidebars and tab bar are square.
- No drop shadows; separation comes from hairline rules and the three ink levels.
- Readable line width stays Obsidian's default; generous paragraph spacing.
- Active file in the file explorer: the file name turns red. No bar, no filled background.
  (Changed after mobile testing: a left bar rendered as a rounded arc on mobile.)
- Active tab: a 2px red top border.
- Cursor and text selection: a red block cursor (`caret-shape: block`, not a stick); selection uses a low-alpha red.
- Status bar and file counts in monospace.

## Bureau details (used sparingly)
- **Frontmatter / Properties** read as a case-file header: monospace keys, uppercase muted
  labels, hairline box.
- **Tags** read as classification stamps: monospace uppercase, 1px red border, red text,
  transparent background, no `#` hidden (Obsidian default kept). No vertical padding and a
  fixed size (also inside headings), so a stamp never overlaps the lines around it.
- **Callouts** read as Bureau memos: hairline box, 2px left bar in the callout's color,
  uppercase monospace title. Callout colors are remapped to the palette (note/info → blue,
  warning/danger/bug → red, everything else → greys) so no rainbow appears.
- **Highlights `==text==`** become redaction bars: solid text-strong background with matching
  text color (unreadable) in reading view; revealed on hover. In the editor (live preview with
  cursor on the line, or source mode) they stay readable, with a subtle grey background, so
  editing is never blocked.
- **Blockquotes**: 2px muted left rule, italic off, muted text.
- **Horizontal rule**: 1px rule with a small red square in the middle.

## Motion
None added. Obsidian's own transitions are kept; nothing pulses, glows or animates.

## Out of scope
- Style Settings options, custom fonts, icon replacements, graph-view restyling beyond
  palette colors (nodes greys, current/tag nodes red, links rule color), plugin-specific styling.

## Testing
- No automated tests (CSS only). Verification: render a sample note covering every element
  above in both modes in a headless browser using Obsidian's class names, screenshot it, and
  check contrast ratios of body text, muted text and both accents with a small script.
- Not tested inside real Obsidian by me; the user verifies there.
