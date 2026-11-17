# Markdown template for teacher review

Use this layout for the solution you show the teacher. Every field maps onto the lesson data, so keep the headings and field names exactly as written. Equations go in `$$ … $$` so they render in most Markdown viewers; write them as `left side = right side`.

````markdown
# <Card name, at most 24 characters>

- **Lesson id:** <short-kebab-case-id, unique among the lessons>
- **Card subtitle:** <one line, at most 45 characters>
- **Topic / level:** <e.g. AP Calculus AB, integration>
- **Source:** <what the teacher sent, e.g. "photo of handwritten work", "worksheet.pdf, problem 3", "slides 4–7 of unit5.pptx">

## Problem (as transcribed)

<The problem exactly as given, in words and/or $$ … $$.>

**Transcription notes:** <Anything uncertain in the original and how it was read, or "None". If the teacher supplied a solution, say whether the steps below are theirs (and what was split or changed) or yours.>

## Solution

### Step 1 · <LABEL IN CAPITALS>
$$ <left side> = <right side> $$
<One-sentence note: why this step happens.>
- Review page: yes | no
- Hint: <optional: a question that nudges the student>
- Note: <optional: a short teaching remark>

### Step 2 · <LABEL>
…

### Step N · FINAL ANSWER
$$ <left side> = <final answer> $$
<One-sentence note.>
- Review page: yes

## Checks performed

- <How the answer was verified, e.g. "Differentiated the answer and recovered the integrand.">

## Questions for the teacher

- <Anything you need decided, or "None".>
````

Rules:

- A step has at most one hint *or* one note (a lesson usually has two or three in total).
- A step with no left side (a bare expression, e.g. an expansion) is written `$$ <expression> $$` with no equals sign.
- The highlight colour for the part that changed is `\textcolor{#1776F8}{…}`; you may show it in the Markdown so the teacher sees what will be highlighted.
- Leave out layout details (stacked lines, review pages); those are decided when converting to lesson data.
