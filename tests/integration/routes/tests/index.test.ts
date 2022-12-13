import path from 'path';
import { fs, ROUTE_MANIFEST, ROUTE_MINIFEST_FILE } from '@modern-js/utils';
import type {
  // Browser,
  Page,
} from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  modernStart,
} from '../../../utils/modernTestUtils';

declare const page: Page;

// declare const browser: Browser;

const appDir = path.resolve(__dirname, '../');

const renderSelfRoute = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/one`, {
    waitUntil: ['networkidle0'],
  });
  const description = await page.$('.description');
  const targetText = await page.evaluate(el => el.textContent, description);
  expect(targetText.trim()).toEqual('Get started by editing src/App.tsx');
  expect(errors.length).toEqual(0);
};

const renderPageRoute = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/two/user`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.user');
  const targetText = await page.evaluate(el => el.textContent, element);
  expect(targetText.trim()).toEqual('user');
  expect(errors.length).toEqual(0);
};

const renderDynamaticRoute = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/two/item/1234`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.item');
  const targetText = await page.evaluate(el => el.textContent, element);
  expect(targetText.trim()).toEqual('1234');
  expect(errors.length).toEqual(0);
};

const supportGlobalLayout = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/two/user`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.global-layout');
  const targetText = await page.evaluate(
    el => el.firstChild.textContent,
    element,
  );
  expect(targetText.startsWith('global layout'));
  expect(targetText.trim()).toEqual('global layout');
  expect(errors.length).toEqual(0);
};

const supportLayout = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/two/shop`, {
    waitUntil: ['networkidle0'],
  });
  const globalLayoutElm = await page.$('.global-layout');
  const text = await page.evaluate(
    el => el.firstChild.textContent,
    globalLayoutElm,
  );
  expect(text.trim()).toEqual('global layout');

  const shopLayoutElm = await globalLayoutElm!.$('.shop-layout');
  const text1 = await page.evaluate(
    el => el.firstChild.textContent,
    shopLayoutElm,
  );
  expect(text1.trim()).toEqual('shop layout');

  const shopElm = await shopLayoutElm!.$('.shop');
  const text2 = await page.evaluate(el => el.textContent, shopElm);
  expect(text2.trim()).toEqual('shop');

  expect(errors.length).toEqual(0);
};

const supportNestedRoutes = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('user layout')).toBeTruthy();
  expect(text.includes('user page')).toBeTruthy();

  await page.goto(`http://localhost:${appPort}/three/user/profile`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el.textContent, rootElm1);
  expect(text1.includes('root layout')).toBeTruthy();
  expect(text1.includes('user layout')).toBeTruthy();
  expect(text1.includes('profile layout')).toBeTruthy();
  expect(text1.includes('profile page')).toBeTruthy();

  expect(errors.length).toEqual(0);
};

const supportDynamaicPaths = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/user/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('1234')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const supportNoLayoutDir = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/user/1234/profile`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('user layout')).toBeTruthy();
  expect(text.includes('item page')).toBeFalsy();
  expect(text.includes('profile page, param is 1234')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const supportPathLessLayout = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('auth layout')).toBeFalsy();

  await page.goto(`http://localhost:${appPort}/three/item`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el.textContent, rootElm1);
  expect(text1.includes('root layout')).toBeTruthy();
  expect(text1.includes('auth layout')).toBeTruthy();
  expect(text1.includes('shop layout')).toBeTruthy();
  expect(text1.includes('item page')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const supportPathWithoutLayout = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/user/profile/name`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('user layout')).toBeFalsy();
  expect(text.includes('user profile name layout')).toBeTruthy();
  expect(text.includes('profile name page')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const nestedRouteOverPage = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/four`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('page index')).toBeFalsy();
  expect(errors.length).toEqual(0);
};

const supportNestedRouteAndPage = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/four/item/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeFalsy();
  expect(text.includes('1234')).toBeTruthy();

  await page.goto(`http://localhost:${appPort}/four/user/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el.textContent, rootElm1);
  expect(text1.includes('root layout')).toBeTruthy();
  expect(text1.includes('1234')).toBeTruthy();
};

const supportHandleLoaderError = async (errors: string[], appPort: number) => {
  // const page = await browser.newPage();
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['domcontentloaded'],
  });
  await Promise.all([
    page.click('.loader-error-btn'),
    page.waitForSelector('.error-case'),
  ]);
  const errorElm = await page.$('.error-case');
  const text = await page.evaluate(el => el.textContent, errorElm);
  expect(text.includes('loader error')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportLoadChunksParallelly = async () => {
  const distDir = path.join(appDir, './dist');
  const manifestFile = path.join(distDir, ROUTE_MINIFEST_FILE);
  expect(await fs.pathExists(manifestFile)).toBeTruthy();
  const threeBundleFile = path.join(distDir, 'static/js/three.js');
  const thressBundleContent = await fs.readFile(threeBundleFile);
  expect(thressBundleContent.includes(ROUTE_MANIFEST)).toBeTruthy();
};

const supportLoader = async (errors: string[], appPort: number) => {
  // const page = await browser.newPage();
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['domcontentloaded'],
  });
  const userLayout = await page.$('.user-layout');
  const text = await page.evaluate(el => el.textContent, userLayout);
  expect(text).toBe('user layout');
  expect(errors.length).toBe(0);
};

const supportLoaderForSSRAndCSR = async (errors: string[], appPort: number) => {
  // const page = await browser.newPage();
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['domcontentloaded'],
  });
  await Promise.all([
    page.click('.user-btn'),
    page.waitForSelector('.user-layout'),
  ]);
  const userLayout = await page.$(`.user-layout`);
  const text = await page.evaluate(el => el.textContent, userLayout);
  expect(text).toBe('user layout');
  expect(errors.length).toBe(0);
};

const supportLoaderForCSR = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/four/user/123`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('user layout')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportRedirectForSSR = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/redirect`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('profile page')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportRedirectForCSR = async (errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['networkidle0'],
  });
  await Promise.all([
    page.click('.redirect-btn'),
    page.waitForSelector('.user-profile'),
  ]);
  const rootElm = await page.$('.user-profile');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('profile page')).toBeTruthy();
  expect(errors.length).toBe(0);
};

// TODO: ssr 重定向和 csr 重定向, csr loader
describe('dev', () => {
  let app: unknown;
  let appPort: number;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  describe('self control route', () => {
    test('should render correctly', async () =>
      renderSelfRoute(errors, appPort));
  });

  describe('pages routes', () => {
    test('render pages route correctly', async () =>
      renderPageRoute(errors, appPort));

    test('render dynamic pages route correctly', async () =>
      renderDynamaticRoute(errors, appPort));

    test('support global layout', async () =>
      supportGlobalLayout(errors, appPort));

    test('support _layout', async () => supportLayout(errors, appPort));
  });

  describe('nested routes', () => {
    test('basic usage', async () => supportNestedRoutes(errors, appPort));

    test('dynamic path', async () => supportDynamaicPaths(errors, appPort));

    test('no layout dir', async () => supportNoLayoutDir(errors, appPort));

    test('pathless layout', async () => supportPathLessLayout(errors, appPort));

    test('path without layout', async () =>
      supportPathWithoutLayout(errors, appPort));

    test('support load chunks Parallelly', supportLoadChunksParallelly);

    test('support handle loader error', async () =>
      supportHandleLoaderError(errors, appPort));
  });

  describe('support both page route and nested route', () => {
    test('nested route has higher priority', async () =>
      nestedRouteOverPage(errors, appPort));

    test('support works together', async () =>
      supportNestedRouteAndPage(errors, appPort));
  });

  describe('loader', () => {
    test('support loader', async () => supportLoader(errors, appPort));
    test('support loader for ssr and csr', async () =>
      supportLoaderForSSRAndCSR(errors, appPort));

    test('support loader for csr', () => supportLoaderForCSR(errors, appPort));
    test('support redirect for ssr', () =>
      supportRedirectForSSR(errors, appPort));
    test('support redirect for csr', () =>
      supportRedirectForCSR(errors, appPort));
  });

  afterAll(async () => {
    await killApp(app);
  });
});

describe('build', () => {
  let appPort: number;
  let app: unknown;
  const errors: string[] = [];

  beforeAll(async () => {
    appPort = await getPort();
    await modernBuild(appDir);
    app = await modernStart(appDir, appPort, {
      cwd: appDir,
    });
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  describe('self control route', () => {
    test('should render correctly', async () =>
      renderSelfRoute(errors, appPort));
  });

  describe('pages routes', () => {
    test('render pages route correctly', async () =>
      renderPageRoute(errors, appPort));

    test('render dynamic pages route correctly', async () =>
      renderDynamaticRoute(errors, appPort));

    test('support global layout', async () =>
      supportGlobalLayout(errors, appPort));

    test('support _layout', async () => supportLayout(errors, appPort));
  });

  describe('nested routes', () => {
    test('basic usage', async () => supportNestedRoutes(errors, appPort));

    test('dynamic path', async () => supportDynamaicPaths(errors, appPort));

    test('no layout dir', async () => supportNoLayoutDir(errors, appPort));

    test('pathless layout', async () => supportPathLessLayout(errors, appPort));

    test('path without layout', async () =>
      supportPathWithoutLayout(errors, appPort));

    test('support handle loader error', async () =>
      supportHandleLoaderError(errors, appPort));
  });

  describe('suppot both page route and nested route', () => {
    test('nested route has higher priority', async () =>
      nestedRouteOverPage(errors, appPort));

    test('support works together', async () =>
      supportNestedRouteAndPage(errors, appPort));
  });

  describe('loader', () => {
    test('support loader', async () => supportLoader(errors, appPort));
    test('support loader for ssr and csr', async () =>
      supportLoaderForSSRAndCSR(errors, appPort));

    test('support loader for csr', () => supportLoaderForCSR(errors, appPort));
    test('support redirect for ssr', () =>
      supportRedirectForSSR(errors, appPort));
    test('support redirect for csr', () =>
      supportRedirectForCSR(errors, appPort));
  });

  afterAll(async () => {
    await killApp(app);
  });
});
