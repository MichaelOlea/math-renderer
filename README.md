# Math Renderer

An interactive math rendering engine focused on calculus, especially derivatives and integrals.

Math Renderer turns structured, step-by-step solutions into readable mathematical presentations with equation transitions, explanations, hints, and solution reviews.

## Intended workflow

1. A teacher writes or selects a problem, in any form: a photo of handwritten work, a PDF, a Word document, slides, Markdown or plain text, with or without their own solution.
2. They give it to an AI chatbot or agent.
3. The AI transcribes the problem and develops a solution in Markdown for review.
4. The AI fills out the renderer’s JSON lesson format.
5. Math Renderer presents the lesson interactively.

Teachers can review and correct the transcription and mathematical steps before presenting the lesson.

## AI-assisted authoring

The intended primary authoring interface is a chatbot.

The lesson format should be straightforward for AI to generate and validate. It should describe the problem, ordered solution steps, equations, explanations, optional hints, and final answer.

Markdown provides a readable version for review. JSON provides the structured input for rendering. Both should describe the same solution.

The renderer controls presentation and playback. Mathematical correctness requires a separate review or verification process.

The workflow is written up as a skill for AI agents in [skills/math-renderer-lesson/](skills/math-renderer-lesson/SKILL.md): how to transcribe and solve the problem, the Markdown layout for teacher review, the rule that no lesson data is written before the teacher approves, and how the approved Markdown becomes lesson data. Agents working in this repository are pointed to it by `AGENTS.md`.

## Current prototype

The repository currently contains a standalone HTML prototype with eleven authored lessons.

Derivatives:

- Power rule
- Product rule
- Quotient rule
- Chain rule
- Trigonometric and exponential combinations
- An extended four-factor product example

Integrals:

- Power rule for integrals (easy)
- Definite integral with the Fundamental Theorem of Calculus (easy)
- u-substitution (medium)
- Integration by parts, applied twice (hard)
- Partial fractions (hard)

It includes step navigation, optional hints, solution reviews, responsive layouts, light and dark themes, and embedded equation graphics for offline viewing.

The AI authoring workflow is described in the skill above; there is no import button in the page itself yet, so new lessons are added to the file.

## Try it

Download the repository and open `math-rendere.html` in a modern browser.

No installation or build step is required. Choose a problem and navigate using the mouse wheel, arrow keys, or touch gestures.

## Themes

The look can be changed to suit a class, a topic or the season: colours, fonts, a background scene, gentle animation. [examples/ap-calculus-differentiation-animated.html](examples/ap-calculus-differentiation-animated.html) is an autumn version, with an animated valley drawn entirely in code, trees that drop leaves when tapped, wildlife, darker cards and an autumn highlight colour.

A teacher can ask an AI chatbot or agent for something similar ("make it feel like autumn", "use our school colours", "a calm night sky for exam review"), or their own spin on the example. The instructions for the AI are in [skills/math-renderer-theme/](skills/math-renderer-theme/SKILL.md): it works on a copy of the page, changes only the styling and decoration (never the lessons), keeps everything offline in one file, keeps the math readable, and respects students who turn off motion.

To check a themed copy with the same tests: `MATH_PAGE=themes/autumn.html npm test` (use the copy's path).

## Inside the file

Everything lives in `math-rendere.html`, in labelled parts:

1. **Styles**, grouped by screen area (cards, lesson steps, review page, footer, and so on).
2. **Lessons** (`<script id="lesson-data">`): the part you edit. One step per line, followed by the optional hints and key steps.
3. **Equation artwork** (`<script id="lesson-artwork">`): the pre-built MathJax SVGs, one line per lesson. Generated, not edited by hand.
4. **Engine** (`<script id="engine">`): the code that draws the lessons, grouped by purpose. No lesson content lives here.

## Editing a lesson

Each lesson in `LESSONS` is a list of steps, one per line. The comment above `LESSONS` describes every field (`label`, `lhs`, `rhs`, `note`, `summary`, `final`, and the optional stacked-line fields for long equations). Hints (`TEACHING_TIPS`) are matched to steps by their `label`; `KEY_STEPS` picks the chapter starting points shown on the last review page of a long lesson.

- **Notes, labels, hints and key steps** can be edited directly.
- **Math text (`lhs`, `rhs` and the stacked lines)** is drawn from the pre-built artwork in part 3, not from the text itself. After adding a lesson or changing any math text, regenerate the artwork:

  ```
  npm install        # once
  npm run artwork
  ```

  This redraws every equation with MathJax and updates part 3 and the glyph set in the same file. The page itself still needs no install to view.

The full field reference is in [skills/math-renderer-lesson/references/lesson-format.md](skills/math-renderer-lesson/references/lesson-format.md).

## Checking a change

You don't need to run anything yourself. When a change is pushed to GitHub, or a pull request is opened, the tests below run automatically. After a few minutes the commit or pull request shows a green check (everything passed) or a red X. Click the red X, then **Details**, to see what failed; the run's `rendering-report` download includes a screenshot of every failing screen.

For lesson edits, the tests catch mistakes such as:

- math text changed without regenerating the artwork (the page would still show the old equation);
- a hint attached to a label that no longer exists (it would silently stop showing);
- a lesson without a final step, or a key step past the end of the lesson;
- an equation that no longer fits its card, or has lost its alignment.

New lessons are tested automatically. To block pull requests from being merged while tests fail, turn on **Require status checks to pass** for the main branch in the repository's branch settings.

## Rendering tests

An automatic check opens the page in a headless browser at eight screen sizes (large desktop down to a small phone, plus phone landscape) and walks through every problem card, lesson step, hint, review page and step overview. On each screen it verifies that:

- equations stay inside their card or area, and nothing is clipped or overlaps;
- left side, equals sign and right side share one baseline, and review rows share one equals column;
- titles, notes and hints are fully visible and centred with the math;
- no equation is shrunk below a readable size;
- the lesson text and the equation artwork match, every symbol used exists in the embedded glyph set, and every hint points at a real step;
- the math contrasts with the page in both light and dark themes.

A second set of tests checks that the controls work: cards, arrow keys, mouse wheel, swipe, the hint card, the previous-step card, the step overview, the key-step recap and the theme toggle. It also checks that buttons don't flicker when the pointer rests on their edge.

Run it locally (Node 20 or newer; viewing the page itself still needs no install):

```
npm install
npx playwright install chromium
npm test
```

A full run takes about six minutes. To test another copy of the page, such as a themed version, put `MATH_PAGE=<path>` in front of `npm test`. `npx playwright show-report` opens the results, with a screenshot of each failing screen. The GitHub run is defined in `.github/workflows/rendering-tests.yml`.

The rules live in `tests/support/layout-probe.js`. The readability floors at the top of that file (`MIN_MATH_PX`) are the only judgement calls; change them there. New lessons added to `LESSONS` are picked up automatically.

## License

MIT. See [LICENSE](LICENSE).
