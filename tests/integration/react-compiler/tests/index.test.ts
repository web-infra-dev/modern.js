import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

async function getRenderState(page: Page) {
  const count = await page.$eval('[data-testid="count"]', el => el.textContent);
  const childRenders = await page.$eval(
    '[data-testid="child-render-count"]',
    el => el.textContent,
  );
  return { count, childRenders };
}

/**
 * React Compiler memoizes the `<StaticChild />` element created in the parent,
 * so a parent state update must re-render the parent (count changes) without
 * re-rendering the child (child render count stays the same). Without the
 * compiler, the child re-renders on every parent update.
 */
async function expectChildMemoized(page: Page, url: string) {
  await page.goto(url, { waitUntil: ['networkidle0'] });

  const before = await getRenderState(page);
  expect(before.count).toEqual('0');

  await page.click('[data-testid="increment"]');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="count"]')?.textContent === '1',
  );

  const after = await getRenderState(page);
  expect(after.count).toEqual('1');
  expect(after.childRenders).toEqual(before.childRenders);
}

describe('react compiler (dev)', () => {
  let app: unknown;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  test('should skip re-rendering memoized child on parent update', async () => {
    await expectChildMemoized(page, `http://localhost:${appPort}`);
  });

  test('should reference react compiler runtime in dev bundle', async () => {
    const html = await (await fetch(`http://localhost:${appPort}`)).text();
    const scriptSrcs = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(
      match => match[1],
    );
    expect(scriptSrcs.length).toBeGreaterThan(0);

    const sources = await Promise.all(
      scriptSrcs.map(async src => {
        const url = src.startsWith('http')
          ? src
          : `http://localhost:${appPort}${src}`;
        return (await fetch(url)).text();
      }),
    );
    expect(
      sources.some(source => source.includes('react/compiler-runtime')),
    ).toBeTruthy();
  });
});

describe('react compiler (build)', () => {
  let app: unknown;
  let port: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code).toEqual(0);

    app = await modernServe(appDir, port, { cwd: appDir });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  test('should skip re-rendering memoized child on parent update', async () => {
    await expectChildMemoized(page, `http://localhost:${port}`);
  });
});
