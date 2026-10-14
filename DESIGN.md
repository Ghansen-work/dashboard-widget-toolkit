# Design

The goal is one general vision: any dashboard Computer builds should look like it came from the same team. That consistency comes from structure, not from Computer's taste. Computer chooses widgets and data; the toolkit decides how everything looks.

The current visual values are a neutral placeholder. Roadmap stage 2 replaces them with the VLCM design language, by editing `theme/tokens.css` only.

## Principles

1. **Numbers first.** A reader should get the headline in five seconds. KPIs lead, charts explain, tables give detail.
2. **Color means something.** Green, amber, and red are reserved for status (good, warning, critical). Series colors are for telling data apart. The accent color is for emphasis. Nothing is colored for decoration.
3. **Trust the snapshot.** Every dashboard states when its data was pulled and where it came from.
4. **Quiet frame, loud data.** Cards have a hairline border, no shadows or gradients. The one strong element is the heavy rule under the dashboard title with the data-as-of stamp beside it.
5. **Same thing, same look.** A currency value, a date, or a status looks identical in every widget, because one formatter and one set of classes draw them all.

## Tokens

`theme/tokens.css` is the single source of truth for colors, type, spacing, radii, and layout sizes. Tests fail if a color, font, or font size is hardcoded anywhere else. Charts read the same tokens at render time.

| Group | Tokens | Used for |
| --- | --- | --- |
| Surfaces | `--dk-color-page`, `--dk-color-surface`, `--dk-color-rule` | Page background, cards, dividers |
| Ink | `--dk-color-ink`, `-muted`, `-subtle` | Primary text, secondary text, hints |
| Accent | `--dk-color-accent` | Sparklines, focus, single-series emphasis |
| Status | `--dk-color-good`, `-warning`, `-critical`, `-neutral` (+ `-soft`) | Deltas and status pills only |
| Series | `--dk-series-1` to `--dk-series-6` | Chart series, always in this order |
| Type | `--dk-font-sans`, `--dk-text-*`, `--dk-weight-*` | One family, fixed scale |

## Widget anatomy

Every widget is a card with the same parts, drawn by the renderer rather than the widget:

```
┌───────────────────────────────┐
│ Title                         │  required, sentence case
│ Subtitle                      │  optional, one line
│                               │
│ Body (the widget's own part)  │
│                               │
├───────────────────────────────┤
│ Notes                         │  optional: caveats, "Showing 25 of 1,840 rows"
└───────────────────────────────┘
```

The page has a header (title, subtitle, data-as-of stamp), a 12-column grid, and a footer listing sources.

## Layout

- Sizes: **S** = 3 columns, **M** = 6, **L** = 9, **full** = 12. Each widget declares which sizes it supports.
- Widgets flow left to right in spec order. Each row should add up to 12; the validator warns about gaps.
- KPIs go in a row of their own, because cards in a row share a height.
- Order: KPIs, then charts, then tables.
- Tablets: S becomes half width, everything else full. Phones: one column. Print keeps the desktop grid.

## Formatting

All formatting happens in `renderer/core.js` (`format`). Specs always contain raw values.

| Format | Input | Output |
| --- | --- | --- |
| `currency` | `412300` | `$412,300`, or `$412.3K` in KPIs and axes. Cents only under $1,000 |
| `number` | `1234.567` | `1,234.6` |
| `integer` | `14` | `14` |
| `percent` | `0.124` (a fraction) | `12.4%` |
| `date` | `"2026-10-12"` | `Oct 12, 2026` |
| `status` | `{"text": "Overdue", "level": "critical"}` | Colored pill |

Missing values show as an em dash. Large values (10,000 and up) are abbreviated in KPIs and chart axes, with the full value in tooltips.

## Charts

- One chart library (ECharts), styled entirely from tokens. No animation: these are static reports.
- Vertical bars for time periods and a few short categories. Horizontal bars for rankings and long names, sorted largest first.
- Stack only when the series add up to a meaningful total.
- Legends appear only when there is more than one series.
- No pie charts yet. If we add one, limit it to five slices.

## Writing

- Titles say what and when: "Revenue by account manager, Q3 2026".
- Sentence case everywhere. No trailing periods on titles. No all-caps labels.
- Empty states explain what's missing: "No open tickets older than 30 days."
- The data-as-of hint tells readers how to refresh: ask Computer to rebuild.
