# Math Renderer

A general-purpose engine for rendering step-by-step mathematics as interactive lessons, with an initial focus on **derivatives and integrals**.

The goal is to let teachers, students, developers, and AI-assisted authoring tools describe a mathematical explanation as structured content, then present it with readable equations, paced transitions, optional hints, and a complete solution review.

## Project status

This repository currently contains a working, standalone **derivative lesson prototype**. The reusable engine and integral curriculum described below are the proposed direction, not implemented features.

### Available today

- Six authored derivative lessons: power rule, product rule, quotient rule, chain rule, trig and exponential combinations, and an extended four-factor example.
- Step-by-step equation transitions with scroll, keyboard, and touch navigation.
- Optional hints and notes.
- A view of previously revealed steps and a complete solution review.
- Responsive equation layouts, light and dark themes, fullscreen mode, and reduced-motion handling.
- Embedded, pre-rendered MathJax SVG equations for offline viewing.

### Run the current prototype

Clone or download this repository and open [math-rendere.html](math-rendere.html) in a modern browser. The filename above is the current filename, including its spelling.

No package installation or build step is required for the existing prototype.

Choose a problem, then navigate with the mouse wheel, arrow keys, or a swipe.

| Key | Action |
| --- | --- |
| Right / Down / Page Down / Space | Next step |
| Left / Up / Page Up | Previous step |
| G | Open the revealed-step overview |
| Home | Return to the first step |
| End | Jump to the furthest revealed position |
| Escape | Close the step overview, or return to the problem catalog |
| F | Toggle fullscreen where supported |

## Direction

Build one reusable playback engine that can present many kinds of mathematics. Calculus is the first curriculum, with two connected areas:

**Derivatives:** explain rates of change through differentiation rules, worked examples, and eventually tangent-line visualizations.

**Integrals:** explain antiderivatives and accumulation through integration rules, substitution, integration by parts, definite integrals, and eventually area visualizations.

Start with carefully authored solutions. Automatic solving, symbolic verification, graphing, and AI generation are separate future capabilities. Rendering an explanation does not establish that its mathematics is correct.

## Proposed repository organization

Keep one application with clear module boundaries initially. Separate packages can come later if the engine needs independent consumers.

The paths below are a migration target; they do not exist yet.

| Path | Responsibility |
| --- | --- |
| index.html | Application entry point |
| src/app/ | Startup, topic catalog, and application wiring |
| src/core/ | Lesson validation, playback state, navigation, progress, and review selection |
| src/rendering/ | Equation-renderer interface, SVG adapter, layout, and transitions |
| src/ui/ | Catalog, player controls, hints, review views, and accessibility behavior |
| src/styles/ | Theme tokens, shared styles, and responsive layouts |
| lessons/derivatives/ | Authored derivative lessons grouped by technique |
| lessons/integrals/ | Authored integral lessons grouped by technique |
| lessons/schema/ | Versioned lesson schema and validation rules |
| scripts/ | Equation asset generation and standalone HTML export |
| public/generated/math/ | Generated equation SVG assets; avoid hand editing |
| tests/core/ | Playback and schema tests |
| tests/lessons/ | Content validation and mathematical reference cases |
| tests/rendering/ | Equation layout and visual regression checks |
| docs/ | Architecture, lesson-authoring guide, and roadmap |
| examples/ | Small examples showing how to use the engine |

### Module boundaries

- **Lesson content** describes equations, explanations, rules, assumptions, hints, and review points.
- **The core engine** decides which step is active and which steps may be revisited. It should not depend on calculus topics or the browser DOM.
- **The renderer** turns equation content into visible output and handles sizing and transitions.
- **The interface** connects user input to the engine and presents the catalog and controls.
- **Build tools** generate equation assets and optionally package a lesson collection into a portable offline HTML file.

A new integration lesson should be a content addition, without special-case navigation code. Replace lesson-array indexes and label-based references with stable lesson and step IDs.

## Proposed lesson format

Use versioned JSON as the portable interchange format. Keep LaTeX as the editable equation source and generate SVG assets from it.

This is an illustrative future format, not an API supported by the current prototype:

~~~json
{
  "schemaVersion": 1,
  "id": "integrals.power-rule.basic",
  "topic": "integrals",
  "title": "Integrate a polynomial",
  "variable": "x",
  "assumptions": ["x is real"],
  "steps": [
    {
      "id": "problem",
      "label": "The integral",
      "equation": {
        "latex": "\\int 3x^2\\,dx"
      },
      "explanation": "Find an antiderivative of 3x squared.",
      "spokenMath": "The indefinite integral of three x squared with respect to x.",
      "includeInReview": true
    },
    {
      "id": "apply-power-rule",
      "label": "Apply the power rule",
      "rule": "integration.power",
      "equation": {
        "latex": "\\int 3x^2\\,dx = 3\\frac{x^3}{3}+C"
      },
      "explanation": "Increase the exponent by one and divide by the new exponent.",
      "includeInReview": true
    },
    {
      "id": "answer",
      "label": "Final answer",
      "equation": {
        "latex": "\\int 3x^2\\,dx = x^3+C"
      },
      "explanation": "C is an arbitrary constant.",
      "includeInReview": true,
      "final": true
    }
  ]
}
~~~

Support a complete equation rather than requiring every step to fit an equals-sign layout. Calculus explanations also need standalone expressions, inequalities, aligned derivations, substitutions, and evaluations at bounds.

Add optional semantic annotations later to highlight an inner function, track a factor, or connect a substitution across steps. Keep colors and animation timing in presentation settings rather than hard-coding them into the mathematical content.

## Calculus roadmap

| Stage | Deliverable |
| --- | --- |
| 1. Extract the prototype | Move lesson data, styles, navigation, and SVG assets into separate files while preserving the existing experience. |
| 2. Generalize the engine | Add schema validation, stable IDs, a renderer interface, and lesson-configured review groups. Remove derivative-specific globals and hard-coded lesson indexes. |
| 3. Add integral lessons | Begin with polynomial antiderivatives, the constant of integration, and basic definite integrals. Add substitution and integration by parts next. |
| 4. Connect calculus concepts | Show differentiation as a check of an antiderivative and explain the Fundamental Theorem of Calculus. |
| 5. Extend presentation | Add coordinated graphs, tangent lines, Riemann sums, and shaded accumulation regions. |
| 6. Improve authoring | Add lesson previews, validation feedback, reusable templates, and portable offline exports. |

A useful first integral lesson is the example above: integrate 3x squared, explain the arbitrary constant, and check the result by differentiation. It exercises the shared engine without requiring graphs or a symbolic solver.

## Correctness and accessibility

As the engine grows:

- Validate lesson IDs, step IDs, required fields, references, and final-answer markers.
- Review each authored transformation and record relevant domains and assumptions.
- State integration-rule restrictions, such as the power rule excluding exponent -1.
- Distinguish indefinite integrals, which include an arbitrary constant, from definite integrals, which evaluate between bounds.
- Treat numerical spot checks as supporting evidence; they do not prove symbolic equivalence.
- Check long fractions, nested expressions, mobile layouts, keyboard focus, and reduced-motion behavior.
- Provide spoken equation descriptions alongside SVG output.

## Contributing

For the current prototype, lesson definitions live in the HTML's LESSONS array, optional teaching notes live in TEACHING_TIPS, and equation graphics live in SVG_GLYPHS.

Changing equation source currently also requires updating the corresponding embedded SVG graphics. An automated generation workflow is planned; this repository does not yet provide documented generation or test commands.

For the refactor, prioritize preserving the six existing lessons before adding new techniques. Keep mathematical content independent of rendering and navigation.

## License

[MIT](LICENSE).
