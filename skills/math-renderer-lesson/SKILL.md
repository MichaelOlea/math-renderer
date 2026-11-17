---
name: math-renderer-lesson
description: Turn a teacher's math problem into a Math Renderer lesson, whatever form it arrives in (photo, scan, PDF, Word, PowerPoint, Markdown, LaTeX or typed in chat; with or without the teacher's own solution). Transcribe and solve it, write the solution as Markdown for the teacher to review, revise until the teacher approves, then write the approved solution into the lesson data of math-rendere.html. Use for any request to add, create or change a lesson in Math Renderer.
---

# Math Renderer: from a teacher's problem to a lesson

The teacher is the authority on the problem and on how it is taught. Your job is to transcribe faithfully, solve correctly, explain in small steps, and change nothing the teacher has not approved.

The work has two phases, separated by a gate:

1. **Markdown phase.** Read the teacher's material → solve (or check the teacher's solution) and verify → write the Markdown → review loop with the teacher.
2. **The gate.** The teacher explicitly approves the Markdown.
3. **Lesson phase.** Convert the approved Markdown into the lesson data → generate the artwork → run the tests → show the result.

**Never write lesson data before the teacher approves the Markdown.** Approval is an explicit statement such as "approved", "looks good, go ahead" or "make the lesson". Silence, "thanks", or approval of only part of the solution is not approval of the whole. If you are unsure, ask: "Shall I turn this into the lesson now?"

## 1. Read the teacher's material

The problem can arrive in any form. Read all of it before starting.

| The teacher sends | How to read it |
|---|---|
| Photo, scan or screenshot (handwritten or printed) | Look at the image itself. |
| PDF | Read the text; also look at the page images, since equations in PDFs often extract as garbled text. A scanned PDF has no text layer, so treat it as images. |
| Word (.docx) or PowerPoint (.pptx) | Read the text, and look for equations stored as Office math, as images, or in speaker notes. When in doubt, view the pages or slides as images. |
| Markdown, LaTeX or plain text | Read it directly; the math is usually already in TeX or close to it. |
| Typed in the chat | Read it directly. |

If you cannot open a file, or part of it (an embedded image, a garbled equation), say exactly which part, and ask for another format or a screenshot of that part. Never fill a gap by guessing.

Then work out what the material contains:

- **Only the problem:** transcribe it (below), then solve it yourself in step 2.
- **The problem and the teacher's own solution** (a worked solution, slides walking through it, or a Markdown file already in the template): the teacher's steps are the lesson. Keep their method, order and wording, and only split steps that do too much at once. Still check every step in step 2. If you find a mistake, point it out and ask; do not silently correct it.
- **Several problems** (a worksheet, a multi-page PDF, a slide deck): list them and ask which become lessons. Each lesson goes through the review loop on its own.

### Transcribe exactly

- Copy the problem exactly as given: every number, sign, exponent, limit of integration and instruction ("find", "evaluate", "simplify"). Do not fix, simplify or reinterpret it.
- Some readings are ambiguous: handwriting (1/7, 5/S, x/×, a minus sign versus a dash, a missing bracket), and text extracted from PDFs or slides (superscripts flattened onto the line, so x² becomes x2; fractions run together; symbols dropped). If any reading is uncertain, **ask the teacher before solving**. Never guess silently. Show the uncertain part and the readings you considered.
- Note any method the teacher wants used ("use u-substitution"), and use that method even when another is shorter.

## 2. Solve and verify

- If the teacher supplied a solution, check it step by step instead of writing your own. Otherwise solve with the method a student at that level is expected to use; if the teacher named none, use the standard method for the topic.
- **Verify before showing anything.** Differentiate an antiderivative back; for a derivative, check a numerical value with a finite difference; for a definite integral, recompute the value another way. If you can run code, check symbolically (for example with SymPy). State in the Markdown which checks you did.
- If the problem as written has no clean solution or looks mistyped, say so and ask. Do not quietly solve a different problem.

## 3. Write the Markdown

Use [references/markdown-template.md](references/markdown-template.md) exactly. It maps one-to-one onto the lesson data, so the conversion later is mechanical. [references/example-u-sub.md](references/example-u-sub.md) is a complete example.

Write the steps for a student seeing the problem for the first time:

- **One idea per step.** A rule stated, a substitution made, one term simplified. Usually 8–12 steps; long problems up to about 25.
- **Label**: a short heading in capitals, at most 26 characters ("CHOOSE u", "APPLY THE FORMULA"). Labels must be unique within the lesson, because hints are attached by label.
- **Equation**: `left side = right side` in TeX. Write the left side so the student knows what is being found (`I`, `f'(x)`, `u`, `du`). Highlight the part that changed in this step with `\textcolor{#1776F8}{…}`, at most one or two highlights per step.
- **Note**: one sentence, at most about 75 characters, that says *why* the step happens, not a restatement of the equation.
- **Review page**: mark the steps a student needs to see the whole derivation at a glance (the problem, key choices, main results, the answer). Typically 3–6.
- **Hints and notes** (optional): a hint is a question that nudges ("Which rule handles a product?"); a note is a short teaching remark. Two or three per lesson is plenty.
- The last step is the final answer, labelled `FINAL ANSWER`. Include a check step before it when the topic allows (differentiating back, substituting a value).

## 4. Review loop

- Present the Markdown in full and ask the teacher to approve it or suggest changes. Point out anything you were unsure of.
- When the teacher asks for changes, apply them, **re-verify the mathematics** (an edit to one step often affects later ones), and show the updated Markdown. Say briefly what changed.
- Repeat until the teacher explicitly approves. Keep the latest approved version; it is the only input for the next phase.
- If the teacher changes something mathematically wrong, explain the problem politely and let them decide. The teacher may intend a deliberate simplification for their class.

## 5. Convert the approved Markdown into lesson data

Follow [references/lesson-format.md](references/lesson-format.md). In short:

- Add one object to the end of the `LESSONS` array in `math-rendere.html` (inside `<script id="lesson-data">`), one step per line, in the same style as the existing lessons.
- Add the hints and notes to `TEACHING_TIPS` under the lesson's `id`, keyed by step label.
- If the review page has more than 6 rows, set `"longReview": true` and add the lesson's chapter starting points to `KEY_STEPS`.
- Copy the approved TeX, labels and notes exactly. Do not reword, re-solve or "improve" anything at this stage; if you notice a problem, go back to the teacher.
- Do not edit the artwork block (`<script id="lesson-artwork">`), the glyph sprite or the engine. The artwork is generated in the next step.

## 6. Generate the artwork and test

If you can run commands in the repository:

```
npm install                    # once
npx playwright install chromium   # once
npm run artwork                # draws every equation from the TeX you wrote
npm test                       # checks that everything fits, lines up and works
```

- `npm run artwork` reports any TeX that MathJax cannot read, with the lesson and step. Fix the TeX (it must still say what the teacher approved) and run it again.
- `npm test` must pass. If a step's equation is too long for its screen, the tests say which step and which screen size. Fix it with the `stack` / `mobileStack` fields (see the format reference), never by changing the mathematics. `npx playwright show-report` shows screenshots of every failure.
- Then open `math-rendere.html` in a browser (or take screenshots) and walk through the new lesson once yourself, including the review page.

If you cannot run commands (for example in a chat without a code environment), give the teacher the finished `LESSONS` entry and `TEACHING_TIPS` (and `KEY_STEPS` if needed) as code blocks, and say plainly that whoever maintains the file must paste them in, then run `npm run artwork` and `npm test`. Do not hand-write SVG artwork.

## 7. Show the result

Tell the teacher the lesson is in, how many steps it has, and anything you had to adapt (for example a long equation split over lines on phones). If you could not run the tests, say so.

If the teacher wants the page to look different for their class or the season (colours, a background scene like the autumn example in `examples/`), that is a separate task: follow `skills/math-renderer-theme/SKILL.md`.
