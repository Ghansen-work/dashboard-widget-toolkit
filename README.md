# Dashboard toolkit

A toy chest of dashboard widgets and a standard layout that DevRev Computer uses to build reports. When an AM, exec, or anyone else asks for a dashboard, Computer picks widgets from the catalog, fills them with data, and the renderer produces a dashboard that looks like every other one.

## How it works

```
Request ──> Computer picks widgets ──> spec.json ──> build.js ──> dashboard.html (Canvas)
            (widgets/CATALOG.md)        (data only)   validate,    one self-contained file,
                                                      then render  data baked in
```

Computer never writes HTML. It writes a small JSON spec that says which widgets to use, how wide each one is, and what data goes in it. `scripts/build.js` checks the spec against each widget's schema, reports anything in the wrong place, and only then renders the page. Because the renderer and theme are fixed, every dashboard shares the same design.

Dashboards are snapshots. Computer's Canvas sandbox blocks network access, so the data is baked in when the file is built, and refreshing means asking Computer to rebuild it. Every dashboard shows its data-as-of time in the header.

## Quick start

Requires Node 18 or later. There are no dependencies to install.

```bash
npm test                                             # run all checks
npm run examples                                     # build examples/*.json into out/
node scripts/build.js examples/account-review.json  # build one spec
node scripts/validate.js my-spec.json               # validate without building
```

Open `out/account-review.html` in a browser to see the result.

## Repo layout

```
SKILL.md                 Instructions Computer follows (the DevRev skill entry point)
widgets/
  CATALOG.md             Generated index of every widget: Computer reads this first
  kpi/                   One folder per widget:
    schema.json            fields, sizes, and use-when guidance (the source of truth)
    example.json           a valid example
    checks.js              rules the schema can't express
    render.js              draws the widget body in the browser
    README.md              generated reference
  _template/             Starting point for a new widget
schema/
  dashboard.schema.json  The top-level spec (title, data_as_of, widgets...)
renderer/                Page shell, layout, widget anatomy, formatting
theme/tokens.css         Every color, font, and size. The only file that changes for a redesign
scripts/                 build, validate, docs, and Computer test grading
examples/                Reference dashboards with sample data
tests/                   Automated tests and the Computer test cases
```

## Widgets so far

| Widget | Use it for |
| --- | --- |
| `kpi` | One headline number with an optional change and trend line |
| `bar_chart` | Comparing values across categories or a short run of periods |
| `table` | Individual records, with typed columns and status pills |

See `widgets/CATALOG.md` for the full guidance, and [CONTRIBUTING.md](CONTRIBUTING.md) to add a widget.

## Roadmap

1. **Unit test with Computer** (in progress): make sure it puts data in the right widgets. Automated placement tests live in `tests/fixtures/`; prompts for Computer live in `tests/computer/`. See [TESTING.md](TESTING.md).
2. **Apply the VLCM design language**: replace the placeholder values in `theme/tokens.css`. Nothing else should need to change.
3. **Integration test with Computer**: the most complex dashboard we can think of.
4. **Grow the widget library as a team**: see [CONTRIBUTING.md](CONTRIBUTING.md) and the widget ideas list there.

## Uploading to DevRev as a skill

The repo root is the skill: `SKILL.md` is the entry point and everything it references is relative to it. Upload the folder without `tests/`, `out/`, and `.git/`. Computer needs Node 18+ in its shell to run `scripts/build.js`.

## Technical notes

- **Charts** use ECharts 5.5.1, loaded from `cdn.jsdelivr.net` (one of the three hosts Computer's sandbox allows), pinned in `scripts/lib/config.js`. It's only included when a chart widget is used. ECharts doesn't rely on `eval`, which the sandbox blocks.
- **Validation** uses a small built-in JSON Schema validator, so the build needs no `npm install`. It supports a limited set of keywords, and a test fails if a schema uses one it doesn't understand.
- **Outside DevRev**, the HTML file needs internet access to load the chart library and font. Charts show a clear message if it can't load. For sharing by email, export a PDF.
- **Safety:** spec text is inserted with `textContent` only, and a test confirms that spec content can't break out of the page.

## Moving to the VLCM organization

All data in this repo is fake sample data. When the toolkit is ready, transfer the repo to the VLCM GitHub organization (Settings > Transfer ownership); history, issues, and stars move with it.
