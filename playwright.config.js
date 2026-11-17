// Rendering tests for math-rendere.html. Run with:  npm test
// Every test runs once per screen size listed below.
const { defineConfig } = require('@playwright/test');

const screen = (width, height) => ({ viewport: { width, height } });

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    deviceScaleFactor: 1,
    // Transitions finish instantly, so each screen is measured in its final position.
    reducedMotion: 'reduce'
  },
  projects: [
    { name: 'desktop-1920x1080', use: screen(1920, 1080) },
    { name: 'desktop-1440x900', use: screen(1440, 900) },
    { name: 'laptop-1280x720', use: screen(1280, 720) },
    { name: 'tablet-landscape-1024x768', use: screen(1024, 768) },
    { name: 'tablet-portrait-820x1180', use: screen(820, 1180) },
    { name: 'phone-390x844', use: screen(390, 844) },
    { name: 'small-phone-360x640', use: screen(360, 640) },
    { name: 'phone-landscape-844x390', use: screen(844, 390) }
  ]
});
