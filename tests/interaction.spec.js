// Checks that the controls work: cards, keyboard, wheel, swipe, hint card,
// previous-step card, step overview, key-step recap and the theme toggle.
const { test, expect } = require('@playwright/test');
const { Studio } = require('./support/studio');

const step = page => page.evaluate(() => window.derivativeStudio.step);
const mode = page => page.evaluate(() => window.derivativeStudio.mode);
// After a step change the page ignores input for a moment (longer for the wheel).
const KEY_PAUSE = 120, WHEEL_PAUSE = 800;

async function openLesson(page, testInfo, lessonId) {
  const studio = new Studio(page, testInfo);
  await studio.open();
  const index = (await studio.lessons()).findIndex(l => l.id === lessonId);
  await page.locator(`.problem-card[data-lesson="${lessonId}"]`).click();
  await expect.poll(() => mode(page)).toBe('lesson');
  // Stepping forward and back through the API proves the opening transition has finished.
  await studio.goto(1);
  await studio.goto(0);
  await page.waitForTimeout(KEY_PAUSE);
  return { studio, index };
}

test('clicking a card opens its lesson, Escape returns to the cards', async ({ page }, testInfo) => {
  const { index } = await openLesson(page, testInfo, 'chain');
  expect(await page.evaluate(() => window.derivativeStudio.lesson)).toBe(index);
  await expect(page.locator('#titleTrack .title-item.visible')).toHaveText('THE FUNCTION');
  await expect(page.locator('#currentCount')).toHaveText('01');
  await page.keyboard.press('Escape');
  await expect.poll(() => mode(page)).toBe('catalog');
  await expect(page.locator('#catalog')).toBeVisible();
});

test('arrow keys, Home and End move between steps', async ({ page }, testInfo) => {
  await openLesson(page, testInfo, 'power');
  for (const [key, expected] of [['ArrowRight', 1], ['ArrowDown', 2], ['ArrowLeft', 1], ['PageDown', 2], [' ', 3], ['ArrowUp', 2], ['Home', 0]]) {
    await page.keyboard.press(key);
    await expect.poll(() => step(page), `after pressing "${key}"`).toBe(expected);
    await page.waitForTimeout(KEY_PAUSE);
  }
  await expect(page.locator('#currentCount')).toHaveText('01');
  // End jumps to the furthest step already revealed (step 4 here), never past it.
  await page.keyboard.press('End');
  await expect.poll(() => step(page)).toBe(3);
});

test('mouse wheel and swipe move one step per gesture', async ({ page }, testInfo) => {
  await openLesson(page, testInfo, 'power');
  await page.waitForTimeout(WHEEL_PAUSE);
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => step(page), 'wheel down').toBe(1);
  await page.waitForTimeout(WHEEL_PAUSE);
  await page.mouse.wheel(0, -120);
  await expect.poll(() => step(page), 'wheel up').toBe(0);
  await page.waitForTimeout(KEY_PAUSE);
  const swipe = (fromY, toY) => page.evaluate(([y0, y1]) => {
    const touch = y => new Touch({ identifier: 1, target: document.body, clientX: 150, clientY: y });
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(y0)], changedTouches: [touch(y0)] }));
    window.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(y1)] }));
  }, [fromY, toY]);
  await swipe(400, 250);
  await expect.poll(() => step(page), 'swipe up').toBe(1);
  await page.waitForTimeout(KEY_PAUSE);
  await swipe(250, 400);
  await expect.poll(() => step(page), 'swipe down').toBe(0);
});

test('hint card opens and closes; previous-step card goes back', async ({ page }, testInfo) => {
  const { studio } = await openLesson(page, testInfo, 'power');
  const tip = page.locator('#tipCard');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#tipCardBody')).toBeHidden();
  await tip.click();
  await expect(tip).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#tipCardBody')).toContainText('one term at a time');
  await tip.click();
  await expect(page.locator('#tipCardBody')).toBeHidden();

  await expect(page.locator('#previousPreview')).toBeHidden(); // nothing before step 1
  await studio.goto(2);
  await expect(page.locator('#previousName')).toHaveText('THE POWER RULE');
  await page.locator('#previousPreview').click();
  await expect.poll(() => step(page)).toBe(1);
  await studio.goto(3);
  await expect(tip).toHaveAttribute('aria-expanded', 'false'); // a new step starts with its hint closed
});

test('step overview lists only visited steps and jumps to the chosen one', async ({ page }, testInfo) => {
  const { studio } = await openLesson(page, testInfo, 'quotient');
  await studio.goto(1); await studio.goto(2); await studio.goto(3);
  await page.waitForTimeout(KEY_PAUSE);
  await page.keyboard.press('g');
  await expect(page.locator('#globalOverlay')).toBeVisible();
  await expect(page.locator('.global-step')).toHaveCount(4);
  await expect(page.locator('.global-step.current-step .global-step-number')).toHaveText('04');
  await page.keyboard.press('Escape');
  await expect(page.locator('#globalOverlay')).toBeHidden();
  expect(await mode(page), 'Escape closes the overview, not the lesson').toBe('lesson');

  await page.locator('#globalBtn').click();
  await page.locator('.global-step').nth(1).click();
  await expect(page.locator('#globalOverlay')).toBeHidden();
  await expect.poll(() => step(page)).toBe(1);
});

test('the review page follows the last step; key-step recap jumps back and returns', async ({ page }, testInfo) => {
  const { studio } = await openLesson(page, testInfo, 'parts');
  const { total, reviewPages } = await studio.state();
  const steps = total - reviewPages;
  for (let i = 1; i < steps; i++) await studio.goto(i);
  await page.waitForTimeout(KEY_PAUSE);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => step(page)).toBe(steps);
  await expect(page.locator('#overview')).toHaveClass(/active/);
  await expect(page.locator('.overview-heading')).toContainText('COMPLETE DERIVATION');

  await studio.goto(total - 1);
  await expect(page.locator('.overview-foot')).toHaveText('End of derivation');
  const keySteps = page.locator('#keyStepGrid .key-step');
  await expect(keySteps).toHaveCount(5);
  await keySteps.first().click();
  await expect.poll(() => step(page)).toBe(1);
  await expect(page.locator('#resumeBtn')).toBeVisible();
  await page.locator('#resumeBtn').click();
  await expect.poll(() => step(page)).toBe(total - 1);
  await expect(page.locator('#resumeBtn')).toBeHidden();
});

test('theme toggle switches light/dark and is remembered', async ({ page }, testInfo) => {
  const studio = new Studio(page, testInfo);
  await studio.open({ theme: 'light' });
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  expect(await theme()).toBe('light');
  await page.locator('#themeToggle').click();
  expect(await theme()).toBe('dark');
  await expect(page.locator('#themeToggle')).toHaveAttribute('aria-label', 'Switch to light mode');
  expect(await page.evaluate(() => localStorage.getItem('derivativeStudioTheme'))).toBe('dark');
  await page.locator('#themeToggle').click();
  expect(await theme()).toBe('light');
});

test('hovered buttons do not flicker when the pointer rests on their bottom edge', async ({ page }, testInfo) => {
  const { studio } = await openLesson(page, testInfo, 'parts');
  const { total } = await studio.state();
  await studio.goto(2);
  const restOnBottomEdge = async selector => {
    const box = await page.locator(selector).first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 1);
    await page.waitForTimeout(400);
    // Sample the top edge over several frames: it must hold still.
    const tops = await page.evaluate(async sel => {
      const el = document.querySelector(sel), out = [];
      for (let i = 0; i < 10; i++) { await new Promise(r => requestAnimationFrame(r)); out.push(Math.round(el.getBoundingClientRect().top * 10) / 10); }
      return out;
    }, selector);
    expect(new Set(tops).size, `${selector} moved between frames: ${tops.join(', ')}`).toBe(1);
  };
  for (const selector of ['#previousPreview', '#tipCard', '#globalBtn', '#themeToggle']) await restOnBottomEdge(selector);
  // An open hint card is a reading panel: it should hold still under the pointer too.
  await page.locator('#tipCard').click();
  await restOnBottomEdge('#tipCard');
  await page.locator('#tipCard').click();
  await page.mouse.move(1, 1);
  await studio.goto(total - 1);
  await page.waitForSelector('#overview.ready-final');
  await restOnBottomEdge('#keyStepGrid .key-step');
});
