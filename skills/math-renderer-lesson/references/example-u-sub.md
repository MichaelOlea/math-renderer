# u-substitution

- **Lesson id:** u-sub
- **Card subtitle:** Substitute the inner function
- **Topic / level:** AP Calculus AB, integration (medium)
- **Source:** typed in the chat (problem only)

## Problem (as transcribed)

Find the integral
$$ \int 6x(x^2+1)^5\,dx $$

**Transcription notes:** None.

## Solution

### Step 1 · THE INTEGRAL
$$ I = {\displaystyle\int} 6x(x^2+1)^5\,dx $$
An inner function appears alongside its own derivative.
- Review page: yes
- Hint: Look for an expression inside a power whose derivative also appears.

### Step 2 · CHOOSE u
$$ u = \textcolor{#1776F8}{x^2+1} $$
Pick the inside expression whose derivative is also present.
- Review page: yes

### Step 3 · FIND du
$$ du = \textcolor{#1776F8}{2x}\,dx $$
Differentiate u, then multiply by dx.
- Review page: yes

### Step 4 · MATCH THE INTEGRAND
$$ 6x\,dx = 3\cdot\textcolor{#1776F8}{2x\,dx}=3\,du $$
6x dx is exactly three times du.
- Review page: no
- Hint: How many copies of 2x dx make 6x dx?

### Step 5 · SUBSTITUTE
$$ I = 3{\displaystyle\int} u^5\,du $$
The whole integral is now written in u.
- Review page: yes

### Step 6 · INTEGRATE
$$ I = 3\cdot\textcolor{#1776F8}{\frac{u^6}{6}}+C $$
Power rule for integrals, in the variable u.
- Review page: no

### Step 7 · SIMPLIFY
$$ I = \frac{u^6}{2}+C $$
Three sixths is one half.
- Review page: no

### Step 8 · SUBSTITUTE BACK
$$ I = \frac{(\textcolor{#1776F8}{x^2+1})^6}{2}+C $$
Replace u with x² + 1 so the answer is in x.
- Review page: yes
- Note: The original question was in x, so the answer must be too.

### Step 9 · CHECK BY DIFFERENTIATING
$$ \frac{d}{dx}\left[\frac{(x^2+1)^6}{2}\right] = 3(x^2+1)^5\cdot 2x=6x(x^2+1)^5 $$
The chain rule brings back the original integrand.
- Review page: no

### Step 10 · FINAL ANSWER
$$ I = \frac{(x^2+1)^6}{2}+C $$
Substitute, integrate, then switch back to x.
- Review page: yes

## Checks performed

- Differentiated the answer with the chain rule and recovered 6x(x²+1)⁵ (step 9).

## Questions for the teacher

- None.

---

## The same lesson as lesson data

After approval, the Markdown above becomes this entry at the end of `LESSONS` (one step per line). Step 9 is too long for one line, so it also gets a `stack` and a `mobileStack`; nothing else was added.

```json
{"id":"u-sub","name":"u-substitution","subtitle":"Substitute the inner function","steps":[
 {"label":"THE INTEGRAL","lhs":"I","rhs":"{\\displaystyle\\int} 6x(x^2+1)^5\\,dx","note":"An inner function appears alongside its own derivative.","summary":true,"final":false},
 {"label":"CHOOSE u","lhs":"u","rhs":"\\textcolor{#1776F8}{x^2+1}","note":"Pick the inside expression whose derivative is also present.","summary":true,"final":false},
 {"label":"FIND du","lhs":"du","rhs":"\\textcolor{#1776F8}{2x}\\,dx","note":"Differentiate u, then multiply by dx.","summary":true,"final":false},
 {"label":"MATCH THE INTEGRAND","lhs":"6x\\,dx","rhs":"3\\cdot\\textcolor{#1776F8}{2x\\,dx}=3\\,du","note":"6x dx is exactly three times du.","summary":false,"final":false},
 {"label":"SUBSTITUTE","lhs":"I","rhs":"3{\\displaystyle\\int} u^5\\,du","note":"The whole integral is now written in u.","summary":true,"final":false},
 {"label":"INTEGRATE","lhs":"I","rhs":"3\\cdot\\textcolor{#1776F8}{\\frac{u^6}{6}}+C","note":"Power rule for integrals, in the variable u.","summary":false,"final":false},
 {"label":"SIMPLIFY","lhs":"I","rhs":"\\frac{u^6}{2}+C","note":"Three sixths is one half.","summary":false,"final":false},
 {"label":"SUBSTITUTE BACK","lhs":"I","rhs":"\\frac{(\\textcolor{#1776F8}{x^2+1})^6}{2}+C","note":"Replace u with x² + 1 so the answer is in x.","summary":true,"final":false},
 {"label":"CHECK BY DIFFERENTIATING","lhs":"\\frac{d}{dx}\\left[\\frac{(x^2+1)^6}{2}\\right]","rhs":"3(x^2+1)^5\\cdot 2x=6x(x^2+1)^5","note":"The chain rule brings back the original integrand.","summary":false,"final":false,"mobileStack":["\\frac{d}{dx}\\left[\\frac{(x^2+1)^6}{2}\\right]","{}=3(x^2+1)^5\\cdot 2x","{}=6x(x^2+1)^5"],"stack":["\\frac{d}{dx}\\left[\\frac{(x^2+1)^6}{2}\\right]","{}=3(x^2+1)^5\\cdot 2x","{}=6x(x^2+1)^5"]},
 {"label":"FINAL ANSWER","lhs":"I","rhs":"\\frac{(x^2+1)^6}{2}+C","note":"Substitute, integrate, then switch back to x.","summary":true,"final":true}
]}
```

And in `TEACHING_TIPS`:

```js
'u-sub': {
  'THE INTEGRAL': { type: 'hint', text: 'Look for an expression inside a power whose derivative also appears.' },
  'MATCH THE INTEGRAND': { type: 'hint', text: 'How many copies of 2x dx make 6x dx?' },
  'SUBSTITUTE BACK': { type: 'note', text: 'The original question was in x, so the answer must be too.' },
},
```
