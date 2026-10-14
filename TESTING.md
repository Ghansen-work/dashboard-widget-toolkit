# Testing

Testing has two layers: automated tests that run on every change, and test runs with Computer that check it uses the toolkit correctly.

## Automated tests

```bash
npm test
```

| File | What it checks |
| --- | --- |
| `tests/placement.test.js` | Each fixture in `tests/fixtures/` is a mistake Computer could make (text in a number field, mismatched series, a status cell as plain text, an invented field, a layout gap). The validator must catch every one. |
| `tests/schemas.test.js` | Every widget has complete metadata, a valid example, and only uses schema keywords the validator supports. |
| `tests/examples.test.js` | The reference dashboards validate with no errors or warnings. |
| `tests/build.test.js` | Built files only load from hosts Computer's sandbox allows, never use eval or network calls, and can't be broken by hostile spec text. |
| `tests/design.test.js` | No hardcoded colors, fonts, or font sizes outside `theme/tokens.css`. |
| `tests/docs.test.js` | Generated widget docs match the schemas. |
| `tests/cases.test.js` | The Computer test cases are well formed. |

## Stage 1: unit testing with Computer

Goal: confirm Computer picks the right widgets and puts data in the right places.

`tests/computer/cases.json` holds prompts with expectations. For each case:

1. Give Computer the prompt (with the skill installed).
2. Ask it to attach the `spec.json` it built along with the dashboard.
3. Grade it:
   ```bash
   node scripts/check-case.js ranking path/to/spec.json
   ```
   The grader checks that the spec validates cleanly and meets the case's expectations (for example, "uses a horizontal bar chart in currency format"). It also prints manual checks to judge by eye.
4. Note the result and anything surprising. Run each case two or three times, since Computer's output varies between runs.

When Computer gets something wrong, decide where the fix belongs:

- **It chose the wrong widget:** sharpen `x-use-when` / `x-dont-use-when` in that widget's schema.
- **It put the wrong data in a field:** improve the field's `description`, or add a check in `checks.js`.
- **It ignored a rule:** strengthen `SKILL.md`.

Then add a fixture or case so the mistake is caught from then on.

Run `node scripts/check-case.js --list` to see all cases.

## Stage 3: integration test (planned)

The most complex dashboard we can think of: a dozen or more widgets of every type, several data sources, empty and very large datasets, long labels, and viewing on desktop, phone, and print. To be written once the design language is applied.
