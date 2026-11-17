#!/usr/bin/env node
// Regenerates the equation artwork in math-rendere.html from the TeX in LESSONS.
//
//   npm run artwork            rewrite the artwork (part 2) and the #glyphDefs sprite
//   npm run artwork -- --check report whether the artwork is out of date, change nothing
//   MATH_PAGE=themes/autumn.html npm run artwork   work on another copy of the page
//
// Run it after adding a lesson or changing any math text (lhs, rhs, stack,
// mobileStack, summaryLines, mobileSummaryLines). Notes, labels, hints and key
// steps need no artwork. The page itself stays a single offline file.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');

// MATH_PAGE selects another copy, such as a themed version (relative to the repository root).
const PAGE = path.resolve(path.join(__dirname, '..'), process.env.MATH_PAGE || 'math-rendere.html');
const checkOnly = process.argv.includes('--check');

// ── read the page ────────────────────────────────────────────────────────
const page = fs.readFileSync(PAGE, 'utf8');
function block(start, end) {
  const a = page.indexOf(start), b = page.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`Could not find "${start} … ${end.trim()}" in ${path.basename(PAGE)}.`);
  return { from: a, to: b + end.length, text: page.slice(a + start.length, b + end.length - 1) };
}
const lessonsBlock = block('const LESSONS=', '\n];');
const artBlock = block('const SVG_GLYPHS=', '\n};');
const defsBlock = block('<svg id="glyphDefs"', '</svg>');
let LESSONS;
try { LESSONS = JSON.parse(lessonsBlock.text); } catch (err) {
  throw new Error(`LESSONS is not valid JSON (${err.message}). Check for a missing comma, quote or bracket.`);
}

// ── MathJax: TeX → SVG with a shared glyph cache ─────────────────────────
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const output = new SVG({ fontCache: 'global' });
const doc = mathjax.document('', { InputJax: new TeX({ packages: AllPackages }), OutputJax: output });

const problems = [];
function render(tex, where) {
  const node = doc.convert(tex, { display: false });
  const html = adaptor.outerHTML(node);
  if (/data-mjx-error|<g data-mml-node="merror"/.test(html)) {
    const message = (html.match(/data-mjx-error="([^"]*)"/) || [])[1] || 'unknown TeX error';
    problems.push(`${where}: MathJax could not read "${tex}" (${message})`);
  }
  // Same compact form as the existing artwork: no MathJax bookkeeping attributes,
  // glyphs referenced from the page's #glyphDefs sprite as #g-….
  return html
    .replace(/ (?:data-[\w-]+|jax|focusable|xmlns(?::xlink)?)="[^"]*"/g, '')
    .replace(/xlink:href="#MJX-/g, 'href="#g-');
}

// ── render every piece of math, in the page's artwork shape ──────────────
const art = {};
LESSONS.forEach((lesson, li) => {
  const where = s => `lesson "${lesson.id}" step ${s + 1}`;
  const first = lesson.steps[0];
  const steps = lesson.steps.map((step, si) => {
    const out = {};
    if ('lhs' in step) out.lhs = step.lhs ? render(step.lhs, `${where(si)} lhs`) : ''; // '' = no left-hand side
    out.rhs = render(step.rhs, `${where(si)} rhs`);
    for (const key of ['stack', 'mobileStack']) if (step[key]) out[key] = step[key].map((line, i) => render(line, `${where(si)} ${key} line ${i + 1}`));
    for (const key of ['summaryLines', 'mobileSummaryLines']) if (step[key]) out[key] = step[key].map((line, i) => {
      const row = {};
      if ('lhs' in line) row.lhs = line.lhs ? render(line.lhs, `${where(si)} ${key} row ${i + 1} lhs`) : '';
      row.rhs = render(line.rhs, `${where(si)} ${key} row ${i + 1} rhs`);
      return row;
    });
    return out;
  });
  // The problem card shows the first step as one equation.
  const preview = render(first.lhs ? `${first.lhs}=${first.rhs}` : first.rhs, `lesson "${lesson.id}" card preview`);
  art[li] = { preview, steps };
});
art.equals = render('=', 'equals sign');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

// ── glyph sprite: every outline the artwork uses, defined once ───────────
// Glyphs already in the sprite keep their place and new ones are added at the end,
// so adding a lesson changes as little of the file as possible.
const cache = adaptor.innerHTML(output.fontCache.getCache());
const outline = new Map([...cache.matchAll(/<path id="MJX-([^"]+)" d="([^"]*)"><\/path>/g)].map(([, id, d]) => [id, d]));
const used = new Set([...JSON.stringify(art).matchAll(/#g-([^"\\]+)/g)].map(m => m[1]));
const existingOrder = [...page.slice(defsBlock.from, defsBlock.to).matchAll(/<path id="g-([^"]+)"/g)].map(m => m[1]);
const order = [...existingOrder.filter(id => used.has(id)), ...[...used].filter(id => !existingOrder.includes(id)).sort()];
const missing = order.filter(id => !outline.has(id));
if (missing.length) throw new Error(`MathJax produced no outline for: ${missing.join(', ')}`);
const sprite = order.map(id => `<path id="g-${id}" d="${outline.get(id)}"/>`).join('');

// ── write (or compare) ───────────────────────────────────────────────────
const artText = '{\n' + Object.entries(art).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',\n') + '\n}';
const defsOpen = page.slice(defsBlock.from, page.indexOf('<defs>', defsBlock.from) + '<defs>'.length);
const defsText = `${defsOpen}${sprite}</defs></svg>`;

const sameArt = JSON.stringify(JSON.parse(artBlock.text)) === JSON.stringify(art);
const samePaths = page.slice(defsBlock.from, defsBlock.to) === defsText;

if (checkOnly) {
  if (sameArt && samePaths) { console.log('Equation artwork is up to date.'); process.exit(0); }
  const stale = LESSONS.filter((l, i) => JSON.stringify(JSON.parse(artBlock.text)[i]) !== JSON.stringify(art[i])).map(l => l.id);
  console.error(`Equation artwork is out of date${stale.length ? ` for: ${stale.join(', ')}` : ''}. Run "npm run artwork" and commit the result.`);
  process.exit(1);
}
if (sameArt && samePaths) { console.log('Equation artwork was already up to date; nothing changed.'); process.exit(0); }

// Splice from the end backwards so earlier offsets stay valid.
let next = page;
next = next.slice(0, artBlock.from) + 'const SVG_GLYPHS=' + artText + ';' + next.slice(artBlock.to);
next = next.slice(0, defsBlock.from) + defsText + next.slice(defsBlock.to);
fs.writeFileSync(PAGE, next);
const count = Object.values(art).filter(v => v.steps).reduce((n, l) => n + l.steps.length, 0);
console.log(`Rebuilt the equation artwork: ${LESSONS.length} lessons, ${count} steps, ${used.size} glyphs.`);
