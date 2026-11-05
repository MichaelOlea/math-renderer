# Math Renderer

An interactive math rendering engine focused on calculus, especially derivatives and integrals.

Math Renderer turns structured, step-by-step solutions into readable mathematical presentations with equation transitions, explanations, hints, and solution reviews.

## Intended workflow

1. A teacher writes or selects a problem, including handwritten work.
2. They upload it to a chatbot.
3. The AI transcribes the problem and develops a solution in Markdown for review.
4. The AI fills out the renderer’s JSON lesson format.
5. Math Renderer presents the lesson interactively.

Teachers can review and correct the transcription and mathematical steps before presenting the lesson.

## AI-assisted authoring

The intended primary authoring interface is a chatbot.

The lesson format should be straightforward for AI to generate and validate. It should describe the problem, ordered solution steps, equations, explanations, optional hints, and final answer.

Markdown provides a readable version for review. JSON provides the structured input for rendering. Both should describe the same solution.

The renderer controls presentation and playback. Mathematical correctness requires a separate review or verification process.

The general JSON format and import workflow are still being discussed.

## Current prototype

The repository currently contains a standalone HTML prototype with six authored derivative lessons:

- Power rule
- Product rule
- Quotient rule
- Chain rule
- Trigonometric and exponential combinations
- An extended four-factor product example

It includes step navigation, optional hints, solution reviews, responsive layouts, light and dark themes, and embedded equation graphics for offline viewing.

The AI-to-JSON workflow and integral lessons are not implemented yet.

## Try it

Download the repository and open `math-rendere.html` in a modern browser.

No installation or build step is required. Choose a problem and navigate using the mouse wheel, arrow keys, or touch gestures.

## License

MIT. See [LICENSE](LICENSE).
