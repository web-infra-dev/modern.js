/* eslint-disable max-lines */
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { fs, ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import type {
  // Browser,
  Page,
} from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  modernServe,
  launchOptions,
} from '../../../utils/modernTestUtils';

// declare const browser: Browser;

const appDir = path.resolve(__dirname, '../');

const renderSelfRoute = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/one`, {
    waitUntil: ['networkidle0'],
  });
  const description = await page.$('.description');
  const targetText = await page.evaluate(el => el?.textContent, description);
  expect(targetText?.trim()).toEqual('Get started by editing src/App.tsx');
  expect(errors.length).toEqual(0);
};

const renderPageRoute = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/user`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.user');
  const targetText = await page.evaluate(el => el?.textContent, element);
  expect(targetText?.trim()).toEqual('user');
  expect(errors.length).toEqual(0);
};

const renderDynamicRoute = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/item/1234`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.item');
  const targetText = await page.evaluate(el => el?.textContent, element);
  expect(targetText?.trim()).toEqual('1234');
  expect(errors.length).toEqual(0);
};

const renderOptionalParamsRoute = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/act/bar`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.item');
  const targetText = await page.evaluate(el => el?.textContent, element);
  expect(targetText?.trim()).toEqual('bid exist');
  expect(errors.length).toEqual(0);

  await page.goto(`http://localhost:${appPort}/two/act/bar/1234`, {
    waitUntil: ['networkidle0'],
  });
  const element1 = await page.$('.item');
  const targetText1 = await page.evaluate(el => el?.textContent, element1);
  expect(targetText1?.trim()).toEqual('1234 bid exist');
  expect(errors.length).toEqual(0);

  await page.goto(`http://localhost:${appPort}/two/act/foo`, {
    waitUntil: ['networkidle0'],
  });
  const element3 = await page.$('.item');
  const targetText3 = await page.evaluate(el => el?.textContent, element3);
  expect(targetText3?.trim()).toEqual('uid exist');
  expect(errors.length).toEqual(0);

  await page.goto(`http://localhost:${appPort}/two/act/foo/1234`, {
    waitUntil: ['networkidle0'],
  });
  const element4 = await page.$('.item');
  const targetText4 = await page.evaluate(el => el?.textContent, element4);
  expect(targetText4?.trim()).toEqual('1234 uid exist');
  expect(errors.length).toEqual(0);

  await page.goto(`http://localhost:${appPort}/two/act/bar/detail`, {
    waitUntil: ['networkidle0'],
  });
  const element5 = await page.$('.item');
  const targetText5 = await page.evaluate(el => el?.textContent, element5);
  expect(targetText5?.trim()).toEqual('bid detail');
  expect(errors.length).toEqual(0);

  await page.goto(`http://localhost:${appPort}/two/act/bar/1234/detail`, {
    waitUntil: ['networkidle0'],
  });
  const element6 = await page.$('.item');
  const targetText6 = await page.evaluate(el => el?.textContent, element6);
  expect(targetText6?.trim()).toEqual('bid detail 1234');
  expect(errors.length).toEqual(0);
};

const supportGlobalLayout = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/user`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.global-layout');
  const targetText = await page.evaluate(
    el => el?.firstChild?.textContent,
    element,
  );
  expect(targetText?.startsWith('global layout'));
  expect(targetText?.trim()).toEqual('global layout');
  expect(errors.length).toEqual(0);
};

const supportLayout = async (page: Page, errors: string[], appPort: number) => {
  await page.goto(`http://localhost:${appPort}/two/shop`, {
    waitUntil: ['networkidle0'],
  });
  const globalLayoutElm = await page.$('.global-layout');
  const text = await page.evaluate(
    el => el?.firstChild?.textContent,
    globalLayoutElm,
  );
  expect(text?.trim()).toEqual('global layout');

  const shopLayoutElm = await globalLayoutElm!.$('.shop-layout');
  const text1 = await page.evaluate(
    el => el?.firstChild?.textContent,
    shopLayoutElm,
  );
  expect(text1?.trim()).toEqual('shop layout');

  const shopElm = await shopLayoutElm!.$('.shop');
  const text2 = await page.evaluate(el => el?.textContent, shopElm);
  expect(text2?.trim()).toEqual('shop');

  expect(errors.length).toEqual(0);
};

const supportNestedRoutes = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('user layout')).toBeTruthy();
  expect(text?.includes('user page')).toBeTruthy();

  await page.goto(`http://localhost:${appPort}/three/user/profile`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el?.textContent, rootElm1);
  expect(text1?.includes('root layout')).toBeTruthy();
  expect(text1?.includes('user layout')).toBeTruthy();
  expect(text1?.includes('profile layout')).toBeTruthy();
  expect(text1?.includes('profile page')).toBeTruthy();

  expect(errors.length).toEqual(0);
};

const supportDynamaicPaths = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/user/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('1234')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const supportNoLayoutDir = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/user/1234/profile`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('user layout')).toBeTruthy();
  expect(text?.includes('item page')).toBeFalsy();
  expect(text?.includes('profile page, param is 1234')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const supportPathLessLayout = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('auth layout')).toBeFalsy();

  await page.goto(`http://localhost:${appPort}/three/item`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el?.textContent, rootElm1);
  expect(text1?.includes('root layout')).toBeTruthy();
  expect(text1?.includes('auth layout')).toBeTruthy();
  expect(text1?.includes('shop layout')).toBeTruthy();
  expect(text1?.includes('item page')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const supportPathWithoutLayout = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/user/profile/name`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('user layout')).toBeFalsy();
  expect(text?.includes('user profile name layout')).toBeTruthy();
  expect(text?.includes('profile name page')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

const nestedRouteOverPage = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/four`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('page index')).toBeFalsy();
  expect(errors.length).toEqual(0);
};

const supportNestedRouteAndPage = async (
  page: Page,
  _errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/four/item/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeFalsy();
  expect(text?.includes('1234')).toBeTruthy();

  await page.goto(`http://localhost:${appPort}/four/user/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el?.textContent, rootElm1);
  expect(text1?.includes('root layout')).toBeTruthy();
  expect(text1?.includes('1234')).toBeTruthy();

  await page.goto(`http://localhost:${appPort}/four/act`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm2 = await page.$('.act');
  const text2 = await page.evaluate(el => el?.textContent, rootElm2);
  expect(text2?.includes('act page, param is')).toBeTruthy();
  expect(text2?.includes('1234')).toBeFalsy();

  await page.goto(`http://localhost:${appPort}/four/act/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm3 = await page.$('.act');
  const text3 = await page.evaluate(el => el?.textContent, rootElm3);
  expect(text3?.includes('act page, param is 1234')).toBeTruthy();
};

const supportHandleLoaderError = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  // const page = await browser.newPage();
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['domcontentloaded'],
  });
  await Promise.all([
    page.click('.loader-error-btn'),
    page.waitForSelector('.error-case'),
  ]);
  const errorElm = await page.$('.error-case');
  const text = await page.evaluate(el => el?.textContent, errorElm);
  expect(text?.includes('loader error')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportLoadChunksParallelly = async () => {
  const distDir = path.join(appDir, './dist');
  const manifestFile = path.join(distDir, ROUTE_MANIFEST_FILE);
  expect(await fs.pathExists(manifestFile)).toBeTruthy();
  const threeBundleFile = path.join(distDir, 'static/js/three.js');
  const thressBundleContent = await fs.readFile(threeBundleFile);
  expect(thressBundleContent.includes(ROUTE_MANIFEST)).toBeTruthy();
};

const supportHandleConfig = async (page: Page, appPort: number) => {
  await page.goto(`http://localhost:${appPort}/three/user/profile/name`, {
    waitUntil: ['networkidle0'],
  });

  await (expect(page) as any).toMatchTextContent(
    'root/user.profile.name.layout/user.profile.name.page',
  );
};

const supportLoader = async (page: Page, errors: string[], appPort: number) => {
  // const page = await browser.newPage();
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['domcontentloaded'],
  });
  await Promise.all([page.waitForSelector('.user-layout')]);
  const userLayout = await page.$('.user-layout');
  const text = await page.evaluate(el => {
    console.info(el);
    return el?.textContent;
  }, userLayout);
  expect(text).toBe('user layout');
  expect(errors.length).toBe(0);
};

const supportLoaderForSSRAndCSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  // const page = await browser.newPage();
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['domcontentloaded'],
  });
  await page.click('.user-btn');
  await page.waitForSelector('.user-layout');
  const userLayout = await page.$(`.user-layout`);
  const text = await page.evaluate(el => {
    return el?.textContent;
  }, userLayout);
  expect(text).toBe('user layout');
  expect(errors.length).toBe(0);
};

const supportLoaderForCSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/four/user/123`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('user layout')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportRedirectForSSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/redirect`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('profile page')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportRedirectForCSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['networkidle0'],
  });
  await page.click('.redirect-btn');
  await page.waitForSelector('.user-profile');
  const rootElm = await page.$('.user-profile');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('profile page')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportDefineInit = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/four/user`, {
    waitUntil: ['networkidle0'],
  });
  const isBrowser = await page.evaluate(() => (window as any).__isBrowser);

  expect(isBrowser).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportCatchAll = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/four/user/1234/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('root layout')).toBeTruthy();
  expect(text?.includes('catch all')).toBeTruthy();
  expect(errors.length).toEqual(0);
};

describe('dev', () => {
  let app: unknown;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      console.log(error.message);
      errors.push(error.message);
    });
  });

  describe('self control route', () => {
    test('should render correctly', async () =>
      renderSelfRoute(page, errors, appPort));
  });

  describe('pages routes', () => {
    test('render pages route correctly', async () =>
      renderPageRoute(page, errors, appPort));

    test('render dynamic pages route correctly', async () =>
      renderDynamicRoute(page, errors, appPort));

    test('support global layout', async () =>
      supportGlobalLayout(page, errors, appPort));

    test('support _layout', async () => supportLayout(page, errors, appPort));
  });

  describe('nested routes', () => {
    test('basic usage', async () => supportNestedRoutes(page, errors, appPort));

    test('dynamic path', async () =>
      supportDynamaicPaths(page, errors, appPort));

    test('support catch all', async () =>
      supportCatchAll(page, errors, appPort));

    test('no layout dir', async () =>
      supportNoLayoutDir(page, errors, appPort));

    test('pathless layout', async () =>
      supportPathLessLayout(page, errors, appPort));

    test('path without layout', async () =>
      supportPathWithoutLayout(page, errors, appPort));

    test('support load chunks Parallelly', supportLoadChunksParallelly);

    test('support handle config', async () =>
      supportHandleConfig(page, appPort));

    // FIXME: skip the test
    test.skip('support handle loader error', async () =>
      supportHandleLoaderError(page, errors, appPort));
  });

  describe('support both page route and nested route', () => {
    test('nested route has higher priority', async () =>
      nestedRouteOverPage(page, errors, appPort));

    test('support works together', async () =>
      supportNestedRouteAndPage(page, errors, appPort));
  });

  describe('loader', () => {
    test('support loader', async () => supportLoader(page, errors, appPort));
    test.skip('support loader for ssr and csr', async () =>
      supportLoaderForSSRAndCSR(page, errors, appPort));

    test('support loader for csr', () =>
      supportLoaderForCSR(page, errors, appPort));
    test('support redirect for ssr', () =>
      supportRedirectForSSR(page, errors, appPort));
    test('support redirect for csr', () =>
      supportRedirectForCSR(page, errors, appPort));
  });

  describe('global configuration', () => {
    test('support app init', async () =>
      supportDefineInit(page, errors, appPort));
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('build', () => {
  let appPort: number;
  let app: unknown;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];

  beforeAll(async () => {
    appPort = await getPort();
    await modernBuild(appDir);
    app = await modernServe(appDir, appPort, {
      cwd: appDir,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  describe('self control route', () => {
    test('should render correctly', async () =>
      renderSelfRoute(page, errors, appPort));
  });

  describe('pages routes', () => {
    test('render pages route correctly', async () =>
      renderPageRoute(page, errors, appPort));

    test('render dynamic pages route correctly', async () =>
      renderDynamicRoute(page, errors, appPort));

    test('render options params pages route correctly', async () =>
      renderOptionalParamsRoute(page, errors, appPort));

    test('support global layout', async () =>
      supportGlobalLayout(page, errors, appPort));

    test('support _layout', async () => supportLayout(page, errors, appPort));
  });

  describe('nested routes', () => {
    test('basic usage', async () => supportNestedRoutes(page, errors, appPort));

    test('dynamic path', async () =>
      supportDynamaicPaths(page, errors, appPort));

    test('support catch all', async () =>
      supportCatchAll(page, errors, appPort));

    test('no layout dir', async () =>
      supportNoLayoutDir(page, errors, appPort));

    test('pathless layout', async () =>
      supportPathLessLayout(page, errors, appPort));

    test('path without layout', async () =>
      supportPathWithoutLayout(page, errors, appPort));

    // FIXME: skip the test
    test.skip('support handle loader error', async () =>
      supportHandleLoaderError(page, errors, appPort));
  });

  describe('suppot both page route and nested route', () => {
    test('nested route has higher priority', async () =>
      nestedRouteOverPage(page, errors, appPort));

    test('support works together', async () =>
      supportNestedRouteAndPage(page, errors, appPort));
  });

  describe('loader', () => {
    test('support loader', async () => supportLoader(page, errors, appPort));
    test('support loader for ssr and csr', async () =>
      supportLoaderForSSRAndCSR(page, errors, appPort));

    test('support loader for csr', () =>
      supportLoaderForCSR(page, errors, appPort));
    test('support redirect for ssr', () =>
      supportRedirectForSSR(page, errors, appPort));
    test('support redirect for csr', () =>
      supportRedirectForCSR(page, errors, appPort));
  });

  describe('global configuration', () => {
    test('support app init', async () =>
      supportDefineInit(page, errors, appPort));
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
/* eslint-enable max-lines */
