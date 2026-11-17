# Lesson data format

All lesson content lives in `math-rendere.html`, inside `<script id="lesson-data">`. It has three parts:

- `LESSONS`: the lessons, in the order their cards appear (up to 20).
- `TEACHING_TIPS`: optional hints and notes, per lesson and step label.
- `KEY_STEPS`: chapter starting points for long lessons.

`LESSONS` must stay valid JSON (double quotes, no trailing commas, backslashes doubled).

## A lesson

```json
{"id":"u-sub","name":"u-substitution","subtitle":"Substitute the inner function","steps":[
 { …step… },
 { …step… }
]}
```

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Short kebab-case identifier, unique among lessons. Used by `TEACHING_TIPS` and `KEY_STEPS`. |
| `name` | yes | Card and screen-reader name, at most 24 characters. |
| `subtitle` | yes | One line, at most 45 characters (read to screen-reader users). |
| `longReview` | no | `true` when the review page would have more than 6 rows: the review is then split into pages and ends with a key-step recap (see `KEY_STEPS`). |
| `steps` | yes | The steps, in order; one step per line in the file. |

The card on the choice screen shows the first step as `lhs = rhs`, so the first step should state the problem (`f(x) = …` or `I = ∫ …`).

Older lessons also carry `title`, `category` and `speech`. Nothing reads them; new lessons can leave them out.

## A step

| Field | Required | Meaning |
|---|---|---|
| `label` | yes | Heading in capitals, at most 26 characters, unique within the lesson. |
| `lhs` | yes | Left side in TeX. Use `""` for a bare expression with no left side; no "=" is then shown. |
| `rhs` | yes | Right side in TeX. Never empty. |
| `note` | yes | One sentence under the equation, at most about 75 characters. Plain text: write x², not TeX. |
| `summary` | yes | `true` if the step appears on the review page. |
| `final` | yes | `true` only on the last step, the final answer. Exactly one per lesson. |
| `stack` | no | The whole equation as a list of lines, shown on every screen size instead of `lhs = rhs`. |
| `mobileStack` | no | Same, but only on screens 730px wide or narrower (phones). |
| `summaryLines` | no | The rows this step contributes to the review page, as `[{"lhs":…,"rhs":…}]`, instead of the single row `lhs = rhs`. |
| `mobileSummaryLines` | no | Same, on phones only. |

### Long equations

Most steps need none of the optional fields. Add them only when `npm test` reports that an equation is too long for a screen, or when an equation is clearly longer than about 60 characters of TeX.

- A stack holds the *whole* equation, left side included. Start each continuation line with `{}=`, `{}+` or `{}-` so the operator gets its normal spacing:
  `["\\frac{d}{dx}\\left[\\frac{(x^2+1)^6}{2}\\right]", "{}=3(x^2+1)^5\\cdot 2x", "{}=6x(x^2+1)^5"]`
- Break at `=` first, then at `+` / `-` between terms; never inside brackets.
- Use `mobileStack` alone when the equation fits on a computer but not on a phone (the common case); add `stack` too when it is long everywhere.
- `summaryLines` is for a step whose review row would be too long, or that defines several things at once (`u = x^2` and `dv = e^x\,dx` become two rows). Give each row a short `lhs`, which may be words: `"\\text{Common}"`.

## TeX conventions

These keep new lessons consistent with the existing ones:

| Write | For |
|---|---|
| `\textcolor{#1776F8}{…}` | Highlighting the part that changed in this step (the only colour used). |
| `f'(x)`, `u'` | Derivatives. Use an apostrophe, never `\prime`. |
| `{\displaystyle\int}` | Integral signs, so they are full size inside a line. |
| `\,dx` | The space before `dx`, `du`, `dv`. |
| `\frac{a}{b}` | Fractions. |
| `\sin`, `\cos`, `\ln`, `\tan` | Function names, never plain `sin`. |
| `\left[ … \right]`, `\big[ … \big]` | Brackets around tall contents. |
| `\text{…}` | Words inside an equation. |
| `\cdot` | Explicit multiplication. |

Every TeX string must be readable by MathJax 3; `npm run artwork` reports any that are not.

## TEACHING_TIPS

```js
const TEACHING_TIPS = {
  'u-sub': {
    'THE INTEGRAL': { type: 'hint', text: 'Look for an expression inside a power whose derivative also appears.' },
    'SUBSTITUTE BACK': { type: 'note', text: 'The original question was in x, so the answer must be too.' },
  },
};
```

- Keyed by lesson `id`, then by the step's exact `label`. A tip whose label does not match a step never appears, and the tests report it.
- `type` is `"hint"` (a question that nudges the student) or `"note"` (a short teaching remark). Keep `text` to one or two short sentences.
- This part is JavaScript, not JSON: quote keys that contain spaces or dashes.

## KEY_STEPS

Only for lessons with `"longReview": true`. The last review page shows a button for each listed step, so students can jump back to a stage. Use the 0-based step position (the first step is 0) of each stage's first step, typically 4–6 of them:

```js
const KEY_STEPS = {
  parts: [1, 2, 5, 9, 12],
};
```

## The equation artwork

Equations are drawn from pre-built SVG artwork (`<script id="lesson-artwork">` and the `#glyphDefs` sprite), so the page works offline with no fonts or libraries. Never edit those by hand. After adding a lesson or changing any TeX, run `npm run artwork`; `npm test` fails if the artwork is out of date.
