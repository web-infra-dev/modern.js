import path from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

interface TestConfig {
  mode: 'dev' | 'build';
}

interface TestOptions {
  baseUrl: string;
  appPort: number;
  page: Page;
}

function skipForLowerNodeVersion() {
  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });
    return true;
  }
  return false;
}

function runTests({ mode }: TestConfig) {
  describe(`${mode}`, () => {
    let app: any;
    let appPort: number;
    let page: Page;
    let browser: Browser;
    const errors: string[] = [];

    if (skipForLowerNodeVersion()) {
      return;
    }

    beforeAll(async () => {
      appPort = await getPort();

      if (mode === 'dev') {
        app = await launchApp(appDir, appPort);
      } else {
        await modernBuild(appDir, [], {});
        app = await modernServe(appDir, appPort, {
          cwd: appDir,
        });
      }

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();

      if (mode === 'build') {
        page.on('pageerror', error => {
          errors.push((error as Error).message);
        });
      }
    });

    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
    });

    describe('csr-rsc-routes-with-loader', () => {
      const baseUrl = `/loader`;

      it('support route as server component and client component', () =>
        supportRouteAsServerComponent({ baseUrl, appPort, page }));

      it('support route as client component and navigation', () =>
        suppportRouteAsClientComponentAndNavigation({
          baseUrl,
          appPort,
          page,
        }));

      it('support direct redirect navigation', () =>
        supportDirectRedirectNavigation({ baseUrl, appPort, page }));

      it('support redirect on first screen load', () =>
        supportRedirectOnFirstScreenLoad({ baseUrl, appPort, page }));

      it('support inject first screen css', () =>
        supportInjectCssFirstScreen({ baseUrl, appPort, page }));

      it('support load css when navigation', () =>
        loadCssWhenNavigation({ baseUrl, appPort, page }));
    });

    describe('csr-rsc-routes-with-fetch', () => {
      const baseUrl = `/component`;

      it('should render with fetch correctly', () =>
        shouldRenderWithFetchCorrectly({ baseUrl, appPort, page }));
    });
  });
}

async function verifyUserPageElements(page: Page) {
  const elementsToCheck = [
    { name: 'root layout', selector: 'body' },
    { name: 'user layout', selector: '.user-layout' },
    { name: 'John Doe', selector: '.user-layout' },
    { name: 'user page data', selector: '.user-layout' },
  ];

  for (const { name, selector } of elementsToCheck) {
    const elementExists = await page.$eval(
      selector,
      (el, name) => {
        return el.textContent?.includes(name);
      },
      name,
    );
    expect(elementExists).toBe(true);
  }
}

async function suppportRouteAsClientComponentAndNavigation({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  await page.waitForSelector('.root-page', { timeout: 5000 });

  const elementsToCheck = [
    { name: 'root layout', selector: 'body' },
    { name: 'root page from server', selector: '.root-page' },
  ];

  for (const { name, selector } of elementsToCheck) {
    await page.waitForFunction(
      (selector, name) => {
        const el = document.querySelector(selector);
        return el?.textContent?.includes(name);
      },
      { timeout: 5000 },
      selector,
      name,
    );

    const elementExists = await page.$eval(
      selector,
      (el, name) => {
        return el.textContent?.includes(name);
      },
      name,
    );
    expect(elementExists).toBe(true);
  }

  await page.click('.user-link');

  await page.waitForSelector('.user-page-data-container');
  await verifyUserPageElements(page);

  await page.click('.home-link');

  await page.waitForSelector('.root-page');
  const rootPageExists = await page.$eval('.root-page', el =>
    el.textContent?.includes('root page from client'),
  );
  expect(rootPageExists).toBe(true);
}

async function supportRouteAsServerComponent({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}/user`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });
  await page.waitForSelector('.user-page-data-container');
  await verifyUserPageElements(page);
}

async function supportDirectRedirectNavigation({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  const rootPageExists = await page.$eval('.root-page', el =>
    el.textContent?.includes('root page from server'),
  );
  expect(rootPageExists).toBe(true);

  await page.click('.redirect-link');

  await page.waitForSelector('.user-page-data-container', { timeout: 5000 });
  await verifyUserPageElements(page);

  const currentUrl = page.url();
  expect(currentUrl).toContain('/user');
}

async function supportRedirectOnFirstScreenLoad({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}/redirect`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  await page.waitForSelector('.user-page-data-container', { timeout: 5000 });
  await verifyUserPageElements(page);

  const currentUrl = page.url();
  expect(currentUrl).toContain('/user');
  expect(currentUrl).not.toContain('/redirect');
}

async function shouldRenderWithFetchCorrectly({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  await page.waitForSelector('.message', { timeout: 5000 });
  const message = await page.$eval('.message', el => el.textContent);
  expect(message).toBe('root page from server');

  const requestUrl = await page.$eval('.request-url', el => el.textContent);
  expect(requestUrl?.length).toBeGreaterThan(0);

  await page.click('.user-link');
  await page.waitForSelector('.user-data', { timeout: 5000 });
  const userData = await page.$eval('.user-data', el => el.textContent);
  expect(userData).toBe('user data from server');

  await page.click('.home-link');
  await page.waitForSelector('.message', { timeout: 5000 });
  const message2 = await page.$eval('.message', el => el.textContent);
  expect(message2).toBe('root page from server');
}

async function supportInjectCssFirstScreen({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  await page.waitForSelector('.root-layout', { timeout: 5000 });

  const rootLayoutColor = await page.$eval('.root-layout', el => {
    const styles = window.getComputedStyle(el);
    return styles.color;
  });

  const isRed = rootLayoutColor === 'rgb(255, 0, 0)';

  expect(isRed).toBe(true);

  await page.goto(`http://localhost:${appPort}${baseUrl}/user`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  const userLayoutColor = await page.$eval('.user-layout', el => {
    const styles = window.getComputedStyle(el);
    return styles.color;
  });

  const isBlue = userLayoutColor === 'rgb(0, 0, 255)';
  expect(isBlue).toBe(true);
}

async function loadCssWhenNavigation({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  await page.click('.user-link');
  await page.waitForSelector('.user-data', { timeout: 5000 });

  const userLayoutColor = await page.$eval('.user-layout', el => {
    const styles = window.getComputedStyle(el);
    return styles.color;
  });
  const isBlue = userLayoutColor === 'rgb(0, 0, 255)';
  expect(isBlue).toBe(true);

  const userPageColor = await page.$eval('.user-page', el => {
    const styles = window.getComputedStyle(el);
    return styles.color;
  });
  const isGreen = userPageColor === 'rgb(0, 128, 0)';
  expect(isGreen).toBe(true);
}

runTests({ mode: 'dev' });
runTests({ mode: 'build' });
