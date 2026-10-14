# Contributing

Everyone on the team will think of widgets nobody else did. This guide keeps new widgets consistent with the rest of the toolkit.

## Adding a widget

1. **Check it's really new.** Look at `widgets/CATALOG.md`. If an existing widget almost fits, consider adding an option to it instead.
2. **Copy the template:** `cp -r widgets/_template widgets/<your_type>`. Use lowercase with underscores, e.g. `line_chart`.
3. **Write `schema.json` first.** This is the contract Computer follows, so it matters most:
   - `x-use-when` and `x-dont-use-when`: one sentence each. Name the widget to use instead in the "don't" sentence. This guidance is what keeps Computer from putting data in the wrong widget.
   - `x-sizes` and `x-default-size`: which grid widths make sense.
   - `x-requires-charts`: `true` if you use ECharts.
   - Every property gets a `description` written for Computer: what goes there, in what form, with an example.
   - Keep it tight: use `enum`, `required`, `minItems`/`maxItems`, and `additionalProperties: false` on nested objects. Don't redefine the shared fields (`type`, `id`, `title`, `subtitle`, `size`, `note`); they're added automatically.
4. **Write `checks.js`** for rules the schema can't express, like "each series has one value per category". List each rule in `x-checks` so it shows up in the docs.
5. **Write `render.js`.** Fill in the body only; the card, title, and notes are drawn for you. Use `ctx.format` for every number and date and `ctx.tokens` for chart colors.
6. **Add `example.json`**, a realistic example with fake data.
7. **Add placement fixtures** in `tests/fixtures/`: at least one mistake Computer is likely to make with your widget, and the error or warning you expect.
8. **Add a Computer test case** to `tests/computer/cases.json`: a prompt where your widget should be the obvious choice.
9. **Generate docs and test:**
   ```bash
   npm run docs
   npm test
   ```
10. **Open a pull request** and include a screenshot of your example rendered.

## Design rules (enforced by tests)

- No colors, font families, or font sizes outside `theme/tokens.css`. Use `var(--dk-...)` in CSS and `ctx.tokens` in chart options.
- No `innerHTML`, `eval`, `new Function`, `fetch`, or other network calls. Computer's sandbox blocks them, and inserting text with `textContent` keeps specs safe.
- External scripts only from `cdn.jsdelivr.net`, with an exact pinned version.
- Follow [DESIGN.md](DESIGN.md) for anatomy, layout, formatting, and writing.

## Review checklist

- [ ] `x-use-when` and `x-dont-use-when` are clear enough that Computer would pick correctly
- [ ] Schema rejects the obvious mistakes (text where a number belongs, unknown fields)
- [ ] Renders well at desktop, tablet, and phone widths, and in print
- [ ] Empty and missing data look intentional, not broken
- [ ] `npm test` passes and docs are regenerated

## Widget ideas

Add to this list when you think of one, even if you're not building it.

- `line_chart`: trends over many periods
- `kpi_target`: progress toward a goal or quota
- `funnel`: pipeline stages
- `status_list`: a short list of items with health indicators
- `text_callout`: Computer's written summary or key takeaway
- `leaderboard`: ranked list with values and change
- `donut`: share of a whole, five slices or fewer
- `timeline`: dated milestones or events
- `heatmap`: activity by day and hour, or account by month
