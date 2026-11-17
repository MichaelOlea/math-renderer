---
name: math-renderer-theme
description: Restyle Math Renderer for a teacher's class or topic, such as an autumn scene, a space theme, school colours or a seasonal background, by changing colours, fonts, background artwork and decorative animation without touching the lessons or breaking readability. Use when a teacher asks to theme, decorate, recolour or "make it look like" something.
---

# Math Renderer: themes

A teacher can ask for the page to fit what they teach or the time of year: "make it feel like autumn", "use our school colours", "a calm night-sky background for exam review". `examples/ap-calculus-differentiation-animated.html` is a complete example: an animated autumn valley drawn entirely in code, with trees that drop leaves when tapped, wildlife, darker cards over the scenery, an autumn-coloured highlight, and an optional ambient sound mode. Teachers may ask for something like it, or their own spin on it.

The math is the point of the page. A theme decorates around it and never makes it harder to read.

## Talk with the teacher first

- Ask what they want it to feel like, and whether it is for every class or one occasion. Offer two or three concrete directions if the request is vague ("warm autumn valley, dark cards" / "light, paper-and-leaves, minimal").
- Ask whether they want motion (falling leaves, drifting clouds) or a still background. Motion is optional, and students who prefer reduced motion must get a still version anyway.
- Ask whether it replaces the standard look or is an extra version. Unless they say otherwise, **make a copy** (for example `themes/autumn.html` or `examples/<name>.html`) and leave `math-rendere.html` as the standard look.

## What to change

Everything visual lives in the `<style>` block, plus optional extra markup and scripts for scenery:

- **Colours.** Start with the custom properties at the top of the styles (`--paper`, `--ink`, `--blue`, `--card-bg`, `--line` and the rest), for light and for dark (`html[data-theme="dark"]`). Many themes need little else.
- **Highlight colour.** Highlighted parts of equations are drawn with the fixed colour `#1776F8` inside the artwork. To recolour them, add a CSS rule rather than editing the artwork; the autumn example does exactly this:
  `mjx-container.MathJax svg g[fill="#1776F8"]{fill:var(--blue)!important;stroke:var(--blue)!important}`
- **Background scenery.** Draw it in code (inline SVG, CSS gradients, small scripts) inside the same file, placed behind the deck. Keep it decorative: `aria-hidden="true"` and `pointer-events: none`, except for elements meant to be played with (like the example's trees), which must be real buttons with labels.
- **Fonts.** Only fonts embedded in the file or system fonts. The page must work offline, so no web-font links, CDNs or remote images.

## What not to change

- **The lesson data and the artwork** (`<script id="lesson-data">`, `<script id="lesson-artwork">`, `#glyphDefs`). A theme never edits math, notes or hints.
- **The engine** (`<script id="engine">`): navigation, review pages and the fitting of equations. If a theme seems to need an engine change, ask first.
- **Input.** The mouse wheel, arrow keys, swipes and clicks drive the lesson. Interactive scenery must not catch them, and its own keyboard handling must only respond while it has focus.
- **Layout of the math.** Do not shrink the equation, title or note areas, or put scenery or panels over them.

## Rules a theme must keep

- **Contrast.** Equations, labels, notes and hints stay clearly readable against whatever is behind them: at least 3:1 for the math and 4.5:1 for small text. Over a busy or bright background, put the math on a solid or strongly tinted card, as the autumn example does. The tests measure background *colours*, not images, so also give the page (`--paper` / `body`) a background-color close to the scenery behind the math; it doubles as the look in lite mode and while scenery loads.
- **Reduced motion.** Inside `@media (prefers-reduced-motion: reduce)` all decorative animation stops.
- **Lite mode.** Low-end devices get the `lite` class on `<html>`. Under `.lite`, turn off heavy scenery: blur, many animated elements, large filters.
- **Sound.** Only if the teacher asks for it, never on by default, with a visible on/off button.
- **Light and dark.** Either theme both, or say that the theme uses one look and remove the toggle in the copy.
- **One file.** The result is still a single HTML file that works offline.

## Check it

```
npm install                       # once
npx playwright install chromium   # once
MATH_PAGE=themes/autumn.html npm test
```

`MATH_PAGE` points the tests at the themed copy; without it they test `math-rendere.html`. The tests check fit, alignment, readability, contrast (light and dark) and that every control still works, at eight screen sizes. `npx playwright show-report` shows screenshots of any failure. Then look at the page yourself on a computer-sized and a phone-sized window, with and without reduced motion, and show the teacher screenshots before calling it done.

If you cannot run commands, say so, and give the teacher the themed file with a note that it has not been through the tests.
