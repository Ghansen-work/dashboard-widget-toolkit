---
name: dashboard-toolkit
description: Build dashboards and visual reports from the team's standard widget toolkit, so every dashboard has the same design. Use this whenever someone asks for a dashboard, report, scorecard, KPI summary, account review, metrics overview, or any visual summary of data, even if they don't say "dashboard".
---

# Dashboard toolkit

You build dashboards by writing a JSON spec. A fixed renderer turns the spec into a single self-contained HTML file. You never write HTML, CSS, or chart code yourself; that is what keeps every dashboard consistent.

Dashboards are snapshots: the data is baked in when you build the file. To refresh, the user asks you to rebuild it.

## Workflow

1. **Understand the request.** Identify the subject, the time range, and who it's for. If one of these is truly missing and you can't pick a sensible default, ask one short question. Otherwise proceed and state your assumptions when you deliver.
2. **Pick widgets.** Read `widgets/CATALOG.md` and choose only from it. Then open `widgets/<type>/README.md` for each widget type you will use; it has the exact fields and an example.
3. **Get the data.** Query the sources you have access to. Aggregate in the query (sums, counts, top N) rather than pulling raw rows. Record the time you ran the queries; that becomes `data_as_of`.
4. **Write the spec** to `spec.json` (see the skeleton below).
5. **Build and validate:**
   ```
   node scripts/build.js spec.json --out <short-name>.html
   ```
   Read every ERROR and WARNING. Fix the spec and run the build again until there are no errors. Fix warnings too, unless you have a specific reason not to; if so, tell the user the reason.
6. **Deliver** the HTML file in Canvas. In your reply, say what the dashboard covers, the data-as-of time, the sources, any assumptions, and anything you couldn't include. If they need to share it outside DevRev, offer a PDF.

## Rules

- **Only catalog widgets.** If no widget fits part of the request, use the closest widget. If nothing reasonable fits, leave that part out and tell the user it isn't supported yet, so it can be added to the toolkit.
- **Never edit** files in `renderer/`, `theme/`, or `widgets/`, and never add styling, colors, or fields the schema doesn't allow.
- **Raw numbers only.** Pass `412300`, not `"$412K"`. The renderer formats everything.
- **Percents are fractions.** `0.45` displays as 45%. This applies to values and deltas.
- **Dates** in tables are `"YYYY-MM-DD"`. `data_as_of` is a full ISO timestamp with offset, e.g. `"2026-10-12T09:14:00-06:00"`.
- **Never invent data.** If a value is unavailable, use `null` (KPI) or an empty table with an `empty_message`, add a `note` explaining why, and mention it to the user.
- **Large data.** Tables show at most 50 rows: pick the top N, sort them, and set `total_count` to the full count.
- **Layout.** Widgets fill a 12-column grid in order (S = 3, M = 6, L = 9, full = 12). Make each row add up to 12. Put KPIs first in a row of their own, then charts, then detail tables.
- **Writing.** Titles in sentence case, no trailing period, and specific: "Revenue by account manager, Q3 2026", not "Revenue chart". Keep subtitles and notes to one line.

## Spec skeleton

```json
{
  "title": "Cedar Valley Schools account review, Q3 2026",
  "subtitle": "Prepared for the quarterly business review",
  "data_as_of": "2026-10-12T09:14:00-06:00",
  "sources": ["DevRev", "Business Central"],
  "widgets": [
    { "type": "kpi", "id": "revenue-ytd", "title": "Revenue, year to date", "value": 1184300, "format": "currency",
      "delta": { "value": 0.124, "label": "vs same period last year" } }
  ]
}
```

Only one widget is shown here; a real first row would have four S-sized KPIs to fill 12 columns. Full examples: `examples/account-review.json` and `examples/sales-overview.json`.
