// Checks that everything the renderer draws is present, aligned and fits.
// What "fits" and "aligned" mean is defined in tests/support/layout-probe.js.
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const { Studio, PAGE_PATH } = require('./support/studio');

// Lesson ids are read from the page source, so a newly added lesson is tested automatically.
const source = fs.readFileSync(PAGE_PATH, 'utf8');
const lessonsStart = source.indexOf('const LESSONS=');
const lessonsEnd = source.indexOf('];', lessonsStart);
if (lessonsStart < 0 || lessonsEnd < 0) throw new Error('Could not find "const LESSONS=[ … ];" in the page; update tests/rendering.spec.js if the lesson data moved.');
const LESSON_IDS = JSON.parse(source.slice(lessonsStart + 'const LESSONS='.length, lessonsEnd + 1)).map(l => l.id);

test('lesson data and embedded artwork are complete', async ({ page }, testInfo) => {
  const studio = new Studio(page, testInfo);
  await studio.open();
  const stats = await studio.check('checkData', 'lesson data');
  expect(stats.lessons).toBe(LESSON_IDS.length);
  expect(studio.consoleProblems, 'browser console while loading').toEqual([]);
});

for (const theme of ['light', 'dark']) {
  test(`problem cards fit and line up (${theme})`, async ({ page }, testInfo) => {
    const studio = new Studio(page, testInfo);
    await studio.open({ theme });
    const stats = await studio.check('checkCatalog', 'problem cards');
    expect(stats.cards).toBe(LESSON_IDS.length);
    await studio.check('checkContrast', `ink contrast (${theme})`);
    await testInfo.attach('scale-stats.json', { body: JSON.stringify({ cards: stats.mathSizes }), contentType: 'application/json' });
  });
}

LESSON_IDS.forEach((id, lessonIndex) => {
  test(`lesson "${id}": every step, hint, review page and overview fits`, async ({ page }, testInfo) => {
    const studio = new Studio(page, testInfo);
    await studio.open();
    await studio.select(lessonIndex);
    const { total, reviewPages } = await studio.state();
    const stepCount = total - reviewPages;
    const stats = { steps: [], previews: [], review: [], overview: [] };

    for (let i = 0; i < stepCount; i++) {
      await studio.goto(i);
      const where = `${id} step ${i + 1}/${stepCount}`;
      const step = await studio.check('checkStep', where);
      stats.steps.push(step.mathSize);
      if (step.previewMathSize) stats.previews.push(step.previewMathSize);
      if (step.hasTip) {
        await page.locator('#tipCard').click();
        await studio.settle();
        await studio.check('checkOpenTip', `${where} with hint open`);
        await page.locator('#tipCard').click();
        await studio.settle();
      }
    }

    for (let pageIndex = 0; pageIndex < reviewPages; pageIndex++) {
      await studio.goto(stepCount + pageIndex);
      await page.waitForSelector('#overview.ready-final');
      await studio.settle();
      const review = await studio.check('checkSummary', `${id} review page ${pageIndex + 1}/${reviewPages}`);
      stats.review.push(review.mathSize);
    }

    // Every step has now been visited, so the overview lists all of them.
    await studio.goto(stepCount - 1);
    await page.evaluate(() => window.derivativeStudio.openSteps());
    await studio.settle();
    const overview = await studio.check('checkGlobalView', `${id} step overview`);
    expect.soft(overview.cards, 'cards in the step overview').toBe(stepCount);
    stats.overview = overview.mathSizes;
    await page.evaluate(() => window.derivativeStudio.closeSteps());

    await studio.check('checkContrast', `${id} ink contrast`);
    expect.soft(studio.consoleProblems, 'browser console').toEqual([]);
    await testInfo.attach('scale-stats.json', { body: JSON.stringify(stats), contentType: 'application/json' });
  });
});
