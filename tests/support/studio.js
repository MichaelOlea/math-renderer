// Drives math-rendere.html through its public window.derivativeStudio API
// and runs the read-only checks from layout-probe.js against each screen.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { expect } = require('@playwright/test');

// The one place that names the page under test. Set MATH_PAGE to test another
// copy, such as a themed version: MATH_PAGE=themes/autumn.html npm test
const PAGE_PATH = path.resolve(path.join(__dirname, '..', '..'), process.env.MATH_PAGE || 'math-rendere.html');
const PAGE_URL = pathToFileURL(PAGE_PATH).href;
const PROBE = path.join(__dirname, 'layout-probe.js');

class Studio {
  constructor(page, testInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.consoleProblems = [];
    this.shots = 0;
    page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) this.consoleProblems.push(`${msg.type()}: ${msg.text()}`); });
    page.on('pageerror', err => this.consoleProblems.push(`uncaught: ${err.message}`));
  }

  async open({ theme = 'light' } = {}) {
    // The stored theme is read on load, so set it before the page's own script runs.
    await this.page.addInitScript(t => { try { localStorage.setItem('derivativeStudioTheme', t); } catch {} }, theme);
    await this.page.goto(`${PAGE_URL}?lite=0`);
    await this.page.waitForFunction(() => !!window.derivativeStudio);
    await this.page.addScriptTag({ path: PROBE });
    await this.settle();
  }

  // Wait until layout has stopped moving: pending rAF-driven fits and CSS transitions.
  async settle() {
    await this.page.evaluate(async () => {
      const frame = () => new Promise(r => requestAnimationFrame(() => r()));
      await frame(); await frame();
      const transitions = document.getAnimations().filter(a => a instanceof CSSTransition);
      await Promise.allSettled(transitions.map(a => a.finished));
      await frame();
    });
  }

  lessons() {
    return this.page.evaluate(() => window.derivativeStudio.lessons.map(l => ({ id: l.id, name: l.name, steps: l.steps.length })));
  }
  state() {
    return this.page.evaluate(() => { const s = window.derivativeStudio; return { mode: s.mode, step: s.step, total: s.total, reviewPages: s.reviewPages }; });
  }

  async select(lessonIndex) {
    await this.page.evaluate(i => window.derivativeStudio.select(i), lessonIndex);
    await this.page.waitForFunction(() => window.derivativeStudio.mode === 'lesson');
    // Navigation is ignored while the catalog→lesson transition runs; stepping
    // forward and back proves it has finished.
    await this.goto(1);
    await this.goto(0);
  }
  async goto(index) {
    await this.page.waitForFunction(i => {
      const s = window.derivativeStudio;
      if (s.step !== i) s.goto(i);
      return s.step === i;
    }, index, { polling: 20 });
    await this.settle();
  }

  // Runs one probe check; on failure attaches a screenshot of exactly that screen.
  async check(name, where) {
    const result = await this.page.evaluate(n => window.__layout[n](), name);
    if (result.problems.length) {
      const shot = await this.page.screenshot();
      await this.testInfo.attach(`${String(++this.shots).padStart(2, '0')} ${where}.png`, { body: shot, contentType: 'image/png' });
    }
    expect.soft(result.problems, where).toEqual([]);
    return result.stats;
  }
}

module.exports = { Studio, PAGE_PATH };
