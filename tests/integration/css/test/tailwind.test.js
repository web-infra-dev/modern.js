/* eslint-disable no-undef */
const path = require('path');
const { resolve } = require('path');
const puppeteer = require('puppeteer');
const {
  clearBuildDist,
  getPort,
  launchApp,
  killApp,
  launchOptions,
} = require('../../../utils/modernTestUtils');

const fixtures = path.resolve(__dirname, '../fixtures');

afterAll(() => {
  clearBuildDist(fixtures);
});

describe('use twin.macro', () => {
  it(`should show style by use tailwindcss theme when use twin.macro v2`, async () => {
    const appDir = resolve(fixtures, 'twin.macro-v2');

    const port = await getPort();

    const app = await launchApp(appDir, port);

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(255, 0, 0)');

    await killApp(app);
    await page.close();
    await browser.close();
  });

  it(`should show style by use tailwindcss theme when use twin.macro v3`, async () => {
    const appDir = resolve(fixtures, 'twin.macro-v3');

    const port = await getPort();

    const app = await launchApp(appDir, port);

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(255, 0, 0)');

    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('use tailwindcss v2', () => {
  it(`should show style by use tailwindcss text-black`, async () => {
    const appDir = resolve(fixtures, 'tailwindcss-v2');

    const port = await getPort();

    const app = await launchApp(appDir, port);

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(0, 0, 0)');

    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('use tailwindcss v3', () => {
  it(`should show style by use tailwindcss text-black`, async () => {
    const appDir = resolve(fixtures, 'tailwindcss-v3');

    const port = await getPort();

    const app = await launchApp(appDir, port);

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(0, 0, 0)');

    await killApp(app);
    await page.close();
    await browser.close();
  });
});

/* eslint-enable no-undef */
