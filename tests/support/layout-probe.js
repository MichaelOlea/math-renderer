/* Injected into the page by the layout tests. Everything here only READS the
   rendered page (geometry, computed styles) and returns plain data, so the
   renderer itself needs no test hooks beyond window.derivativeStudio.

   Each check* function returns {problems: string[], stats: {...}}.
   An empty problems list means the screen passed. */
(() => {
  'use strict';

  const TOL = 1; // px of slack for sub-pixel rounding

  // Smallest size (px per em of math) each kind of equation may be shrunk to.
  // Shrink-to-fit always "fits"; below these it fits but can no longer be read.
  // Tune these to taste: they are the only judgement calls in this file.
  const MIN_MATH_PX = { step: 14, card: 14, review: 11, overviewCard: 7, previousPreview: 5.5 };

  // ── geometry primitives ────────────────────────────────────────────────
  const box = r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
  const rectOf = el => box(el.getBoundingClientRect());
  const isEmpty = r => !r || r.width <= 0 || r.height <= 0;
  const union = rects => {
    const real = rects.filter(r => !isEmpty(r));
    if (!real.length) return null;
    const left = Math.min(...real.map(r => r.left)), top = Math.min(...real.map(r => r.top));
    const right = Math.max(...real.map(r => r.right)), bottom = Math.max(...real.map(r => r.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  const inset = (r, by) => ({ left: r.left + by, top: r.top + by, right: r.right - by, bottom: r.bottom - by, width: r.width - 2 * by, height: r.height - 2 * by });
  // How far `inner` sticks out of `outer` on each side (0 when it fits).
  const spill = (outer, inner) => ({
    left: Math.max(0, outer.left - inner.left), top: Math.max(0, outer.top - inner.top),
    right: Math.max(0, inner.right - outer.right), bottom: Math.max(0, inner.bottom - outer.bottom)
  });
  const spillText = s => Object.entries(s).filter(([, v]) => v > TOL).map(([side, v]) => `${v.toFixed(1)}px past the ${side}`).join(', ');
  const overlapArea = (a, b) => {
    if (isEmpty(a) || isEmpty(b)) return { w: 0, h: 0 };
    return { w: Math.min(a.right, b.right) - Math.max(a.left, b.left), h: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) };
  };
  const overlaps = (a, b, tol = TOL) => { const o = overlapArea(a, b); return o.w > tol && o.h > tol; };

  const shown = el => !!el && el.getClientRects().length > 0 &&
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });

  // The painted outline of the math itself (tighter and more honest than the
  // SVG box: glyphs may overhang the box, and the SVGs use overflow:visible).
  const inkOf = root => union([...root.querySelectorAll('svg')].map(svg => {
    const g = svg.querySelector(':scope > g');
    return rectOf(g || svg);
  }));
  // The laid-out text of an element, wherever it wrapped to.
  const textRectOf = el => {
    const range = document.createRange(); range.selectNodeContents(el);
    return box(range.getBoundingClientRect());
  };
  // Vertical position of a MathJax SVG's text baseline on screen.
  const baselineOf = svg => {
    const cs = getComputedStyle(svg), r = svg.getBoundingClientRect();
    const cssHeight = parseFloat(cs.height) || r.height || 1;
    const scale = r.height / cssHeight;
    return { y: r.bottom + (parseFloat(cs.verticalAlign) || 0) * scale, scale };
  };
  // Rendered size ÷ natural size of an element that the page shrinks with transform:scale().
  const scaleOf = el => el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;

  // The size the math is actually drawn at, in px per em, after every shrink-to-fit transform.
  const mathSizeOf = el => parseFloat(getComputedStyle(el).fontSize) * scaleOf(el);

  const viewportRect = () => ({ left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight });
  const $ = id => document.getElementById(id);

  function expectInside(problems, what, outerName, outer, inner, tol = TOL) {
    if (isEmpty(inner)) { problems.push(`${what} has no rendered size (nothing is drawn)`); return; }
    const s = spill(outer, inner);
    if (Math.max(s.left, s.top, s.right, s.bottom) > tol) problems.push(`${what} does not fit inside ${outerName}: ${spillText(s) || 'sub-pixel'}`);
  }
  function expectApart(problems, aName, a, bName, b, tol = TOL) {
    if (overlaps(a, b, tol)) { const o = overlapArea(a, b); problems.push(`${aName} overlaps ${bName} by ${o.w.toFixed(1)}×${o.h.toFixed(1)}px`); }
  }
  function expectReadable(problems, what, kind, size) {
    if (size < MIN_MATH_PX[kind]) problems.push(`${what} is shrunk to ${size.toFixed(1)}px, below the ${MIN_MATH_PX[kind]}px readability floor`);
  }
  const centreX = r => (r.left + r.right) / 2;
  function expectSame(problems, what, values, tol = TOL) {
    const nums = values.filter(v => Number.isFinite(v));
    if (nums.length < 2) return;
    const spread = Math.max(...nums) - Math.min(...nums);
    if (spread > tol) problems.push(`${what} are out of line by ${spread.toFixed(1)}px (${nums.map(n => n.toFixed(1)).join(', ')})`);
  }
  // lhs, "=" and rhs of one equation row must sit on one text baseline.
  function expectRowBaseline(problems, what, cells) {
    const lines = cells.map(c => c && c.querySelector('svg')).filter(Boolean).map(baselineOf);
    if (lines.length < 2) return;
    expectSame(problems, `${what}: baselines of left side, equals sign and right side`, lines.map(l => l.y), Math.max(TOL, 1.2 * lines[0].scale));
  }

  // ── page chrome shared by every screen ─────────────────────────────────
  function checkChrome(problems) {
    const vp = viewportRect();
    const deck = $('deck');
    if (deck.scrollWidth > deck.clientWidth + TOL) problems.push(`page is wider than the screen by ${deck.scrollWidth - deck.clientWidth}px (horizontal overflow)`);
    const drawn = el => shown(el) && !isEmpty(rectOf(el));
    const controls = [...document.querySelectorAll('.header button, .header .chapter, .header .header-help')].filter(drawn);
    for (const el of controls) expectInside(problems, `header control "${label(el)}"`, 'the screen', vp, rectOf(el));
    for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++)
      expectApart(problems, `header control "${label(controls[i])}"`, rectOf(controls[i]), `"${label(controls[j])}"`, rectOf(controls[j]));
    const footer = [...document.querySelectorAll('.footer')].find(shown);
    if (footer) {
      const parts = [...footer.children].filter(drawn);
      for (const el of parts) expectInside(problems, `footer item "${label(el)}"`, 'the screen', vp, rectOf(el));
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++)
        expectApart(problems, `footer item "${label(parts[i])}"`, contentRect(parts[i]), `"${label(parts[j])}"`, contentRect(parts[j]));
    }
  }
  const label = el => (el.getAttribute('aria-label') || el.id || el.className || el.tagName).toString().trim().split(/\s+/).slice(0, 4).join(' ');
  // Grid cells stretch to their track; compare what is actually inside them.
  const contentRect = el => union([...el.children].filter(shown).map(rectOf)) || textRectOf(el);

  // ── 1. problem-selection cards ─────────────────────────────────────────
  function checkCatalog() {
    const problems = [], cards = [...document.querySelectorAll('.problem-card')];
    const grid = rectOf($('problemGrid')), scales = [];
    if (!cards.length) problems.push('no problem cards were rendered');
    cards.forEach((card, i) => {
      const name = `card ${i + 1} (${card.dataset.lesson})`;
      const cardRect = rectOf(card), cs = getComputedStyle(card);
      const formula = card.querySelector('.card-formula'), line = card.querySelector('.svg-line');
      const ink = inkOf(card);
      // The formula must stay clear of the card's rounded border, not just inside it.
      const safe = inset(cardRect, Math.min(parseFloat(cs.paddingLeft), parseFloat(cs.paddingTop)) / 2);
      expectInside(problems, `${name}: formula`, 'the card', safe, ink);
      expectInside(problems, name, 'the card grid', { ...grid, top: -Infinity, bottom: Infinity }, cardRect);
      const lineRect = rectOf(line), formulaRect = rectOf(formula);
      expectSame(problems, `${name}: formula centre and card centre (horizontal)`, [centreX(lineRect), centreX(cardRect)], 1.5);
      expectSame(problems, `${name}: formula centre and formula-area centre (vertical)`, [(lineRect.top + lineRect.bottom) / 2, (formulaRect.top + formulaRect.bottom) / 2], 1.5);
      scales.push(mathSizeOf(line));
      expectReadable(problems, `${name}: formula`, 'card', mathSizeOf(line));
    });
    const rects = cards.map(rectOf);
    expectSame(problems, 'card widths', rects.map(r => r.width));
    expectSame(problems, 'card heights', rects.map(r => r.height));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++)
      expectApart(problems, `card ${i + 1}`, rects[i], `card ${j + 1}`, rects[j]);
    // Cards in the same row share a top edge; cards in the same column share a left edge.
    const rows = cluster(rects, r => r.top, r => r.height / 2), cols = cluster(rects, r => r.left, r => r.width / 2);
    for (const group of rows) expectSame(problems, 'tops of cards in one row', group.map(r => r.top));
    for (const group of cols) expectSame(problems, 'left edges of cards in one column', group.map(r => r.left));
    checkChrome(problems);
    return { problems, stats: { cards: cards.length, columns: cols.length, mathSizes: scales } };
  }
  // Groups items whose positions are within `near` of each other (the cards of one row or column).
  const cluster = (items, position, near) => [...items].sort((a, b) => position(a) - position(b)).reduce((groups, item) => {
    const last = groups.at(-1);
    if (last && position(item) - position(last[0]) < near(item)) last.push(item); else groups.push([item]);
    return groups;
  }, []);

  // ── 2. one lesson step ─────────────────────────────────────────────────
  function checkStep() {
    const problems = [], stats = {};
    const main = rectOf(document.querySelector('.main')), track = rectOf($('mathTrack'));
    const layer = document.querySelector('#mathTrack .eq-layer.visible');
    if (!layer) return { problems: ['no equation is visible for this step'], stats };
    const version = [...layer.querySelectorAll('.math-version')].find(shown);
    const equation = version && version.querySelector('.math-equation');
    if (!equation) return { problems: ['the visible step has no equation markup'], stats };

    const ink = inkOf(equation), eqRect = rectOf(equation);
    stats.mathSize = mathSizeOf(equation);
    stats.stacked = equation.classList.contains('math-equation-stack');
    stats.inkHeight = ink ? ink.height : 0;
    expectReadable(problems, 'equation', 'step', stats.mathSize);
    expectInside(problems, 'equation', 'the equation area', track, eqRect);
    expectInside(problems, 'equation', 'the lesson area', main, ink);
    if (!stats.stacked) {
      expectRowBaseline(problems, 'equation', ['.math-lhs', '.math-equals', '.math-rhs'].map(s => equation.querySelector(s)));
      if (equation.querySelector('.math-equals') && !inkOf(equation.querySelector('.math-lhs') || document.createElement('i')))
        problems.push('equation starts with a dangling "=" (nothing on its left-hand side)');
    }
    else {
      const lines = [...equation.querySelectorAll('.math-stack-line')].map(inkOf);
      for (let i = 1; i < lines.length; i++) if (lines[i] && lines[i - 1]) expectApart(problems, `stacked line ${i}`, lines[i - 1], `line ${i + 1}`, lines[i], 0.5);
    }

    // Title above and note below must be fully readable, clear of the math and centred with it.
    const centres = [centreX(eqRect)];
    for (const [sel, trackId, what] of [['.title-item.visible', 'titleTrack', 'step title'], ['.note-item.visible', 'noteTrack', 'step note']]) {
      const el = document.querySelector(`#${trackId} ${sel}`);
      if (!el) { problems.push(`${what} is missing`); continue; }
      const text = textRectOf(el);
      expectInside(problems, what, 'its strip (it would be cut off)', rectOf($(trackId)), text);
      expectInside(problems, what, 'the screen', viewportRect(), text);
      expectApart(problems, 'equation', ink, `the ${what}`, text);
      centres.push(centreX(text));
      if (what === 'step note') {
        const ring = document.querySelector('.answer-ring');
        if (document.querySelector('.lesson-scene.is-finished') && shown(ring)) {
          expectApart(problems, 'final-answer underline', rectOf(ring), 'the step note', text, 0.5);
          expectApart(problems, 'final-answer underline', rectOf(ring), 'the equation', ink, 0.5);
        }
      }
    }
    expectSame(problems, 'centres of equation, title and note (horizontal)', centres, 2);

    // Floating cards: previous-step preview (left) and hint/note card (right).
    const previous = $('previousPreview'), tip = $('tipCard');
    const floating = [];
    if (shown(previous)) {
      const r = rectOf(previous); floating.push(['previous-step card', r]);
      expectInside(problems, 'previous-step card', 'the lesson area', main, r);
      stats.previewMathSize = checkMiniMath(problems, 'previous-step card', previous, 'previousPreview');
      expectApart(problems, 'equation', ink, 'the previous-step card', r);
    }
    if (shown(tip)) {
      const r = rectOf(tip); floating.push(['hint card', r]);
      expectInside(problems, 'hint card', 'the lesson area', main, r);
      if (!tip.classList.contains('open')) expectApart(problems, 'equation', ink, 'the (closed) hint card', r);
      checkTipText(problems, tip);
    }
    if (floating.length === 2) expectApart(problems, floating[0][0], floating[0][1], floating[1][0], floating[1][1]);
    stats.hasTip = shown(tip);
    checkChrome(problems);
    return { problems, stats };
  }
  // Small equations inside preview cards are clipped by their wrapper if they do not fit.
  function checkMiniMath(problems, what, root, kind) {
    let size = Infinity;
    for (const wrap of root.querySelectorAll('.preview-math-wrap')) {
      const mini = wrap.querySelector('.mini-equation');
      if (!mini) { problems.push(`${what}: preview equation is missing`); continue; }
      const boxRect = rectOf(wrap), ink = inkOf(mini);
      if (wrap.classList.contains('truncated')) {
        // Too long to show whole at a readable size: by design it runs off the right edge, behind a fade.
        const fade = getComputedStyle(wrap).maskImage || getComputedStyle(wrap).webkitMaskImage;
        if (!fade || fade === 'none') problems.push(`${what}: preview equation is cut off without a fade`);
        if (rectOf(mini).right <= boxRect.right) problems.push(`${what}: preview equation is marked as cut off but actually fits`);
        expectInside(problems, `${what}: preview equation`, 'its preview box (top, bottom and left)', { ...boxRect, right: Infinity }, ink, 1.5);
      } else expectInside(problems, `${what}: preview equation`, 'its preview box (it would be clipped)', boxRect, ink, 1.5);
      expectRowBaseline(problems, `${what}: preview equation`, ['.math-lhs', '.math-equals', '.math-rhs'].map(s => mini.querySelector(s)));
      size = Math.min(size, mathSizeOf(mini));
      expectReadable(problems, `${what}: preview equation`, kind, mathSizeOf(mini));
    }
    return size;
  }
  function checkTipText(problems, tip) {
    const inner = inset(rectOf(tip), 1);
    for (const el of tip.querySelectorAll('.tip-card-head, .tip-card-teaser, .tip-card-body')) {
      if (!shown(el)) continue;
      expectInside(problems, `hint card text (${el.className})`, 'the hint card', inner, textRectOf(el));
    }
    if (getComputedStyle(tip).overflowY !== 'visible' && tip.scrollHeight > tip.clientHeight + TOL) problems.push(`hint card text is taller than the card by ${tip.scrollHeight - tip.clientHeight}px (needs scrolling to read)`);
  }
  // Call after opening the hint card.
  function checkOpenTip() {
    const problems = [], tip = $('tipCard');
    if (!shown(tip) || !tip.classList.contains('open')) return { problems: ['hint card did not open'], stats: {} };
    expectInside(problems, 'open hint card', 'the lesson area', rectOf(document.querySelector('.main')), rectOf(tip));
    expectInside(problems, 'open hint card', 'the screen', viewportRect(), rectOf(tip));
    checkTipText(problems, tip);
    const previous = $('previousPreview');
    if (shown(previous)) expectApart(problems, 'open hint card', rectOf(tip), 'the previous-step card', rectOf(previous));
    return { problems, stats: { height: rectOf(tip).height } };
  }

  // ── 3. "complete derivation" review page ───────────────────────────────
  function checkSummary() {
    const problems = [], stats = {};
    const overview = $('overview'), inner = $('overviewInner'), grid = $('solutionGrid');
    if (!shown(overview)) return { problems: ['the review page is not visible'], stats };
    const area = rectOf(overview);
    stats.mathSize = mathSizeOf(grid); // includes the shrink applied to the whole review block
    expectReadable(problems, 'review equations', 'review', stats.mathSize);
    expectInside(problems, 'review content', 'the review area', area, rectOf(inner));
    expectSame(problems, 'centres of the review content and the review area (horizontal)', [centreX(rectOf(inner)), centreX(area)], 2);
    expectInside(problems, 'review equations', 'the review area', area, inkOf(grid));
    for (const sel of ['.overview-heading', '.overview-foot']) {
      const el = inner.querySelector(sel);
      if (shown(el)) expectInside(problems, `review ${sel.slice(10)}ing text`.replace('footing', 'footer'), 'the screen', viewportRect(), textRectOf(el));
    }
    const rows = [...grid.querySelectorAll('.solution-row')].map((row, i) => {
      const [lhs, equals, rhs] = ['.math-lhs', '.math-equals', '.math-rhs'].map(s => row.querySelector(s));
      expectRowBaseline(problems, `review row ${i + 1}`, [lhs, equals, rhs]);
      return { lhs: inkOf(lhs) && rectOf(lhs), equals: inkOf(equals) && rectOf(equals), rhs: rectOf(rhs), ink: inkOf(row) };
    });
    stats.rows = rows.length;
    if (!rows.length) problems.push('the review page has no rows');
    // Column alignment: one shared "=" column, left sides flush right against it, right sides flush left.
    expectSame(problems, 'review rows: equals signs (horizontal position)', rows.filter(r => r.equals).map(r => r.equals.left));
    expectSame(problems, 'review rows: right edges of the left-hand sides', rows.filter(r => r.lhs).map(r => r.lhs.right));
    expectSame(problems, 'review rows: left edges of the right-hand sides', rows.map(r => r.rhs.left));
    for (let i = 1; i < rows.length; i++) if (rows[i].ink && rows[i - 1].ink)
      expectApart(problems, `review row ${i}`, rows[i - 1].ink, `row ${i + 1}`, rows[i].ink, 0.5);

    const panel = $('keyStepPanel');
    if (shown(panel)) {
      const buttons = [...panel.querySelectorAll('.key-step')];
      stats.keySteps = buttons.length;
      buttons.forEach((b, i) => {
        expectInside(problems, `key-step button ${i + 1}`, 'the review area', area, rectOf(b));
        expectInside(problems, `key-step button ${i + 1} label`, 'its button', rectOf(b), textRectOf(b.querySelector('.key-step-label')));
        for (let j = i + 1; j < buttons.length; j++) expectApart(problems, `key-step button ${i + 1}`, rectOf(b), `button ${j + 1}`, rectOf(buttons[j]));
      });
      expectApart(problems, 'review equations', inkOf(grid), 'the key-step buttons', rectOf(panel.querySelector('.key-step-grid')));
    }
    checkChrome(problems);
    return { problems, stats };
  }

  // ── 4. "all visited steps" overlay ─────────────────────────────────────
  function checkGlobalView() {
    const problems = [], panelEl = document.querySelector('.global-panel');
    if (!shown(panelEl)) return { problems: ['the step overview did not open'], stats: {} };
    expectInside(problems, 'step overview panel', 'the screen', viewportRect(), rectOf(panelEl));
    const list = $('globalList'), listRect = rectOf(list), cards = [...list.querySelectorAll('.global-step')], sizes = [];
    cards.forEach((card, i) => {
      const name = `overview card ${i + 1}`, r = rectOf(card);
      expectInside(problems, name, 'the list (horizontally)', { ...listRect, top: -Infinity, bottom: Infinity }, r);
      sizes.push(checkMiniMath(problems, name, card, 'overviewCard'));
      expectInside(problems, `${name}: step number`, 'the card', r, textRectOf(card.querySelector('.global-step-number')));
      for (let j = i + 1; j < cards.length; j++) expectApart(problems, name, r, `card ${j + 1}`, rectOf(cards[j]));
    });
    expectSame(problems, 'overview card heights', cards.map(c => rectOf(c).height));
    return { problems, stats: { cards: cards.length, mathSizes: sizes } };
  }

  // ── 5. the embedded artwork and lesson data themselves ────────────────
  // ── does the artwork show what the lesson text says? ────────────────
  // The artwork does not record the TeX it was drawn from, so compare what a reader sees:
  // the letters, digits and + − = signs in the TeX against the glyphs the SVG draws.
  // (It cannot spot a change that keeps exactly the same symbols, e.g. swapping two terms.)
  const FUNCTION_NAMES = /\\(sin|cos|tan|sec|csc|cot|ln|log|exp|lim|arctan|arcsin|arccos)\b/g;
  function texSymbols(tex) {
    const text = tex
      .replace(/\\textcolor\{[^}]*\}/g, '')
      .replace(/\\(?:operatorname|mathrm|text)\{([^}]*)\}/g, (m, x) => ` ${x.replace(/[a-z]/gi, c => '§' + c)} `)
      .replace(FUNCTION_NAMES, (m, x) => ` ${[...x].map(c => '§' + c).join('')} `)
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/\\./g, ' ');
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '§') out.push('upright ' + text[++i]);
      else if (/[0-9]/.test(c)) out.push(c);
      else if (/[a-zA-Z]/.test(c)) out.push(c);
      else if ('+-='.includes(c)) out.push(c === '-' ? '−' : c);
    }
    return out.sort();
  }
  function artworkSymbols(svg) {
    const italic = cp => cp === 0x210e ? 'h' : cp >= 0x1d434 && cp <= 0x1d44d ? String.fromCharCode(65 + cp - 0x1d434) : cp >= 0x1d44e && cp <= 0x1d467 ? String.fromCharCode(97 + cp - 0x1d44e) : null;
    const out = [];
    for (const [, font, hex] of String(svg).matchAll(/#g-TEX-([A-Z0-9]+)-([0-9A-F]+)/g)) {
      const cp = parseInt(hex, 16);
      if (font === 'I' && italic(cp)) out.push(italic(cp));
      else if (cp >= 0x30 && cp <= 0x39) out.push(String.fromCharCode(cp));
      else if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) out.push('upright ' + String.fromCharCode(cp));
      else if (cp === 0x2b || cp === 0x3d) out.push(String.fromCharCode(cp));
      else if (cp === 0x2212) out.push('−');
    }
    return out.sort();
  }
  function compareSymbols(problems, where, tex, svg) {
    const want = texSymbols(tex), have = artworkSymbols(svg);
    if (want.join(' ') === have.join(' ')) return;
    const missing = [...want], extra = [];
    for (const g of have) { const i = missing.indexOf(g); if (i >= 0) missing.splice(i, 1); else extra.push(g); }
    problems.push(`${where}: the artwork does not match the lesson text (regenerate the artwork)` +
      (missing.length ? `; in the text but not drawn: ${missing.join(' ')}` : '') + (extra.length ? `; drawn but not in the text: ${extra.join(' ')}` : ''));
  }
  const lineTex = line => typeof line === 'string' ? line : [line.lhs, line.rhs, line.tex].filter(Boolean).join(' ');

  function checkData() {
    const problems = [];
    const { lessons } = window.derivativeStudio;
    // A <use> pointing at a glyph that is not in the sprite draws nothing: a silently missing symbol.
    const walk = (value, path) => {
      if (typeof value === 'string') {
        for (const m of value.matchAll(/href="#([^"]+)"/g)) if (!document.getElementById(m[1])) problems.push(`${path}: glyph "${m[1]}" is used but not defined in #glyphDefs`);
        if (value.includes('data-mjx-error') || value.includes('merror')) problems.push(`${path}: contains a MathJax error box`);
      } else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
    };
    if (typeof SVG_GLYPHS === 'undefined') problems.push('SVG_GLYPHS is not defined');
    else {
      walk(SVG_GLYPHS, 'SVG_GLYPHS');
      lessons.forEach((lesson, i) => {
        const art = SVG_GLYPHS[i];
        if (!art || !art.preview) { problems.push(`lesson "${lesson.id}": no card preview artwork`); return; }
        if (art.steps.length !== lesson.steps.length) problems.push(`lesson "${lesson.id}": ${lesson.steps.length} steps but artwork for ${art.steps.length}`);
        lesson.steps.forEach((step, s) => {
          const g = art.steps[s] || {};
          // A step may deliberately have no left-hand side (a bare expression); then neither does its artwork.
          for (const side of ['lhs', 'rhs']) if (!!step[side] !== !!g[side]) problems.push(`lesson "${lesson.id}" step ${s + 1}: "${side}" is ${step[side] ? 'written in the lesson but has no artwork' : 'empty in the lesson but has artwork'}`);
          if (!step.rhs) problems.push(`lesson "${lesson.id}" step ${s + 1}: the right-hand side is empty`);
          for (const key of ['stack', 'mobileStack', 'summaryLines', 'mobileSummaryLines'])
            if (!!step[key] !== !!g[key] || (step[key] && step[key].length !== g[key].length)) problems.push(`lesson "${lesson.id}" step ${s + 1}: "${key}" in the lesson text and in the artwork do not match`);
            else if (step[key]) step[key].forEach((line, i) => compareSymbols(problems, `lesson "${lesson.id}" step ${s + 1} ${key} line ${i + 1}`, lineTex(line), typeof g[key][i] === 'string' ? g[key][i] : JSON.stringify(g[key][i])));
          for (const side of ['lhs', 'rhs']) if (step[side] && g[side]) compareSymbols(problems, `lesson "${lesson.id}" step ${s + 1} (${step.label}) ${side}`, step[side], g[side]);
        });
      });
    }
    lessons.forEach(lesson => {
      const finals = lesson.steps.filter(s => s.final).length;
      if (finals !== 1 || !lesson.steps.at(-1).final) problems.push(`lesson "${lesson.id}": expected exactly one final step, and it must be the last (found ${finals})`);
      if (!lesson.steps.some(s => s.summary)) problems.push(`lesson "${lesson.id}": no step is marked for the review page`);
      const labels = lesson.steps.map(s => s.label);
      if (typeof TEACHING_TIPS !== 'undefined') for (const tipLabel of Object.keys(TEACHING_TIPS[lesson.id] || {}))
        if (!labels.includes(tipLabel)) problems.push(`lesson "${lesson.id}": hint is attached to "${tipLabel}", which is not a step label, so it never shows`);
      for (const k of lesson.keySteps || []) if (!(k >= 0 && k < lesson.steps.length)) problems.push(`lesson "${lesson.id}": key step ${k} is out of range`);
    });
    if (typeof TEACHING_TIPS !== 'undefined') for (const id of Object.keys(TEACHING_TIPS))
      if (!lessons.some(l => l.id === id)) problems.push(`hints exist for unknown lesson "${id}"`);
    return { problems, stats: { lessons: lessons.length, steps: lessons.reduce((n, l) => n + l.steps.length, 0) } };
  }

  // ── 6. ink is readable against the page in the current theme ──────────
  function checkContrast() {
    const problems = [];
    const parse = c => { const n = (c.match(/[\d.]+/g) || []).map(Number); return { rgb: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 }; };
    const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const over = (top, under) => top.rgb.map((v, i) => v * top.a + under[i] * (1 - top.a)); // alpha blend
    const mix = (c1, c2) => c1.map((v, i) => (v + c2[i]) / 2);
    const pageColour = () => {
      const body = parse(getComputedStyle(document.body).backgroundColor), html = parse(getComputedStyle(document.documentElement).backgroundColor);
      return body.a > 0 ? over(body, html.a > 0 ? html.rgb : [255, 255, 255]) : html.a > 0 ? html.rgb : [255, 255, 255];
    };
    // What the math is painted on: every tinted layer between it and the page, blended in order.
    // Background images (scenery, gradients) cannot be measured, so themes should give the page
    // a background-color close to the scenery behind the math; that colour is what is checked.
    const backdropOf = el => {
      const layers = [];
      let image = false;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        const bg = parse(cs.backgroundColor);
        if (bg.a > 0) layers.push(bg);
        if (cs.backgroundImage !== 'none') image = true;
        if (bg.a >= 0.95) break;
      }
      let colour = pageColour();
      for (const layer of layers.reverse()) colour = over(layer, colour);
      return { colour, image };
    };
    const seen = new Map();
    for (const el of document.querySelectorAll('.problem-card svg g, #mathTrack .eq-layer.visible svg g')) {
      if (!el.hasAttribute('fill')) continue;
      const fill = parse(getComputedStyle(el).fill).rgb, back = backdropOf(el.closest('svg'));
      const key = `${fill} on ${back.colour.map(Math.round)}`;
      if (!seen.has(key)) seen.set(key, { r: ratio(fill, back.colour), fill, back });
    }
    for (const [key, { r, back }] of seen) {
      if (r >= 3) continue;
      problems.push(`math drawn in rgb(${key.replace(' on ', ') has contrast ' + r.toFixed(2) + ':1 against its background rgb(')}); needs at least 3:1` +
        (back.image ? ' (a background image is also behind it: if the scenery is darker or lighter than that colour, set a matching background-color)' : ''));
    }
    if (!seen.size) problems.push('found no drawn math to check contrast on');
    return { problems, stats: { colours: [...seen].map(([k, v]) => `${k} ${v.r.toFixed(1)}:1`) } };
  }

  window.__layout = { checkCatalog, checkStep, checkOpenTip, checkSummary, checkGlobalView, checkData, checkContrast };
})();
