import path from 'path';
import { fs, ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import puppeteer, { type Browser } from 'puppeteer';

import type { Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
  runModernCommand,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

const findRouteByPath = (routes: any[], targetPath: string): any => {
  for (const route of routes) {
    if (route.path === targetPath) {
      return route;
    }
    if (route.children && route.children.length > 0) {
      const found = findRouteByPath(route.children, targetPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

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
  expect(text?.includes('item page, param is 1234')).toBeTruthy();
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

const supportHandleLoaderError = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['domcontentloaded'],
  });

  await page.waitForSelector('.loader-error-btn');

  await Promise.all([
    page.click('.loader-error-btn'),
    page.waitForSelector('.error-loader-page'),
  ]);
  const errorElm = await page.$('.error-loader-page');
  const text = await page.evaluate(el => el?.textContent, errorElm);
  expect(text).toBe('render by client loader');
  expect(errors.length).toBe(0);
};

const supportLoadChunksParallelly = async () => {
  const distDir = path.join(appDir, './dist');
  const manifestFile = path.join(distDir, ROUTE_MANIFEST_FILE);
  expect(await fs.pathExists(manifestFile)).toBeTruthy();
  const threeHtmlPath = path.join(distDir, 'html/three/index.html');
  const threeHtml = await fs.readFile(threeHtmlPath);
  expect(threeHtml.includes(ROUTE_MANIFEST)).toBeTruthy();
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

const supportThrowError = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  const response = await page.goto(
    `http://localhost:${appPort}/three/error/response?type=throw_error`,
    {
      waitUntil: ['domcontentloaded'],
    },
  );
  expect(response?.status()).toBe(200);
  await page.waitForSelector('.error-content');
  const errorStatusElm = await page.$('.error-content');
  const text = await page.evaluate(el => el?.textContent, errorStatusElm);
  expect(text?.includes('500')).toBeFalsy();
  expect(text?.includes("can't found the user")).toBeTruthy();
};

const supportThrowResponse = async (
  page: Page,
  errors: string[],
  appPort: number,
  code: number,
) => {
  const response = await page.goto(
    `http://localhost:${appPort}/three/error/response?type=throw_response&code=${code}`,
    {
      waitUntil: ['domcontentloaded'],
    },
  );
  expect(response?.status()).toBe(200);
  await page.waitForSelector('.response-status');
  const errorStatusElm = await page.$('.response-status');
  const text = await page.evaluate(el => el?.textContent, errorStatusElm);
  expect(text?.includes(`${code}`)).toBeTruthy();
  const errorContentElm = await page.$('.response-content');
  const text1 = await page.evaluate(el => el?.textContent, errorContentElm);
  expect(text1?.includes("can't found the user")).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportReturnResponse = async (
  page: Page,
  errors: string[],
  appPort: number,
  code: number,
) => {
  const response = await page.goto(
    `http://localhost:${appPort}/three/error/response?type=return_response&code=${code}`,
    {
      waitUntil: ['domcontentloaded'],
    },
  );
  expect(response?.status()).toBe(code);
  await page.waitForSelector('.response-content');
  const el = await page.$('.response-content');
  const text = await page.evaluate(el => el?.textContent, el);
  expect(text?.includes('Response Page')).toBeTruthy();
};

const supportLoaderForSSRAndCSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['domcontentloaded'],
  });
  await page.waitForSelector('.user-btn');
  const button = await page.$('.user-btn');
  await button?.click();
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

const supportClientLoader = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['networkidle0'],
  });
  await Promise.all([
    page.click('.client-loader-btn'),
    page.waitForSelector('.client-loader-layout'),
  ]);
  const clientLoaderLayout = await page.$('.client-loader-layout');
  const text = await page.evaluate(el => el?.textContent, clientLoaderLayout);
  expect(text).toBe('layout from client loader');

  await page.waitForSelector('.client-loader-page', { timeout: 5000 });
  const clientLoaderPage = await page.$('.client-loader-page');
  const text1 = await page.evaluate(el => el?.textContent, clientLoaderPage);
  expect(text1?.includes('page from server loader')).toBeTruthy();
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

const getStaticJSDir = (appDir: string) =>
  path.join(appDir, './dist/static/js');

const getHtmlDir = (appDir: string) => path.join(appDir, './dist/html');

const getEntryFile = async (staticJSDir: string) => {
  const files = await fs.readdir(staticJSDir);
  return files.find(file => /^three(\.\w+)?\.js$/.test(file));
};

const testRouterPlugin = async (appDir: string) => {
  const htmlDir = getHtmlDir(appDir);
  const threeHtmlPath = path.join(htmlDir, 'three', 'index.html');
  const threeHtml = await fs.readFile(threeHtmlPath);
  expect(threeHtml.includes('three.')).toBe(true);
  expect(!threeHtml.includes('four.')).toBe(true);
};

const hasHashCorrectly = async (appDir: string) => {
  const staticJSDir = getStaticJSDir(appDir);
  const entryFile = await getEntryFile(staticJSDir);
  expect(entryFile).toBeDefined();

  const htmlDir = getHtmlDir(appDir);
  const threeHtmlPath = path.join(htmlDir, 'three', 'index.html');
  const threeHtml = (await fs.readFile(threeHtmlPath)).toString();

  const threeUserFiles = await fs.readdir(
    path.join(staticJSDir, 'async/three_user'),
  );
  const testFile = threeUserFiles.find(
    file => file.startsWith('page') && file.endsWith('.js'),
  );

  const matched = testFile!.match(/page\.(\w+)\.js$/);
  expect(matched).toBeDefined();
  const hash = matched![1];
  expect(threeHtml.includes(hash)).toBe(true);
};

const supportActionInCSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/four/user/profile`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  await page.click('.action-btn');
  await page.waitForSelector('.data-wrapper');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('profile page')).toBeTruthy();
  expect(text?.includes('modern_four_action')).toBeTruthy();
};

const supportActionInSSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  expect(errors.length).toBe(0);
  await page.goto(`http://localhost:${appPort}/three/user/1234/profile`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  await page.click('.action-btn');
  await page.waitForSelector('.data-wrapper');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('modern_three_action')).toBeTruthy();
};

const supportShouldRevalidateInSSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  expect(errors.length).toBe(0);
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['networkidle0'],
  });
  await page.click('.should-revalidate');
  await page.waitForSelector('.item-page', { timeout: 5000 });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('param is 111')).toBeTruthy();
  await page.click('.should-not-revalidate');
  await page.waitForSelector('.item-page', { timeout: 5000 });
  const text1 = await page.evaluate(el => el?.textContent, rootElm);
  expect(text1?.includes('param is 111')).toBeTruthy();
};

const supportShouldRevalidateInCSR = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  expect(errors.length).toBe(0);
  await page.goto(`http://localhost:${appPort}/four/user/111`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('param is 111')).toBeTruthy();
  await page.click('.should-not-revalidate');
  await new Promise(resolve => setTimeout(resolve, 400));
  const text1 = await page.evaluate(el => el?.textContent, rootElm);
  expect(text1?.includes('param is 111')).toBeTruthy();
};

const supportPrefetchInIntentMode = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  expect(errors.length).toBe(0);
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['networkidle0'],
  });
  let isRequestJS = false;
  let isRequestProfileLayoutData = false;
  let isRequestProfilePageData = false;
  page.on('request', interceptedRequest => {
    if (
      /three_user\/profile\/layout\.([^.]*\.)?js/.test(interceptedRequest.url())
    ) {
      isRequestJS = true;
    }

    if (
      interceptedRequest
        .url()
        .includes('user/profile?__loader=three_user%2Fprofile%2Flayout')
    ) {
      isRequestProfileLayoutData = true;
    }

    if (
      interceptedRequest
        .url()
        .includes('user/profile?__loader=three_user%2Fprofile%2Fpage')
    ) {
      isRequestProfilePageData = true;
    }
  });

  await page.waitForSelector('.user-profile-btn');

  await page.hover('.user-profile-btn');
  await new Promise(resolve => setTimeout(resolve, 400));
  expect(isRequestJS).toBe(true);
  expect(isRequestProfileLayoutData).toBe(true);
  expect(isRequestProfilePageData).toBe(true);
};

const supportPrefetchWithShouldRevalidate = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  expect(errors.length).toBe(0);
  await page.goto(`http://localhost:${appPort}/three/user/222`, {
    waitUntil: ['networkidle0'],
  });
  // make sure assets have been loaded
  await new Promise(resolve => setTimeout(resolve, 800));
  await page.click('.root-btn');
  await new Promise(resolve => setTimeout(resolve, 400));

  let isRequestLayoutData = false;
  let isRequestPageData = false;
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().includes('__loader=three_user%2Flayout')) {
      isRequestLayoutData = true;
    }

    if (
      interceptedRequest.url().includes('__loader=three_user%2F%28id%29%2Fpage')
    ) {
      isRequestPageData = true;
    }
  });
  await page.hover('.should-not-revalidate');
  await new Promise(resolve => setTimeout(resolve, 400));
  expect(isRequestLayoutData).toBe(true);
  expect(isRequestPageData).toBe(false);
};

// config-only routes (entry "two")
const supportConfigOnlyRoutesRender = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('two root layout')).toBeTruthy();
  const home = await page.$('.two-home');
  const homeText = await page.evaluate(el => el?.textContent, home);
  expect(homeText).toBe('two home');
  expect(errors.length).toBe(0);
};

const supportConfigOnlyCatchAll = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/unknown/path`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('two root layout')).toBeTruthy();
  const catchAll = await page.$('.two-catch-all');
  const catchAllText = await page.evaluate(el => el?.textContent, catchAll);
  expect(catchAllText).toBe('catch all route');
  expect(errors.length).toBe(0);
};

const supportConfigOnlyErrorBoundary = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/boom`, {
    waitUntil: ['domcontentloaded'],
  });
  await page.waitForSelector('.two-error');
  const el = await page.$('.two-error');
  const text = await page.evaluate(el => el?.textContent, el);
  expect(text?.includes('boom test')).toBeTruthy();
  expect(errors.length).toBe(0);
};

const supportConfigOnlyRoutesLoader = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/two/user/567`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  expect(text?.includes('two root layout')).toBeTruthy();
  const user = await page.$('.two-user');
  const userText = await page.evaluate(el => el?.textContent, user);
  expect(userText?.includes('user id: 567')).toBeTruthy();
  expect(errors.length).toBe(0);
};

// Hybrid routes test functions
const supportConfigOverridesConventional = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/shop`, {
    waitUntil: ['networkidle0'],
  });
  const shopElm = await page.$('.config-shop');
  const text = await page.evaluate(el => el?.textContent, shopElm);
  expect(text).toBe('config shop page');
  const conventionalShop = await page.$('.conventional-shop');
  expect(conventionalShop).toBeNull();
  expect(errors.length).toBe(0);
};

const supportConfigSupplementsConventional = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/settings`, {
    waitUntil: ['networkidle0'],
  });
  const settingsElm = await page.$('.settings-page');
  const text = await page.evaluate(el => el?.textContent, settingsElm);
  expect(text).toBe('settings page from config route');
  expect(errors.length).toBe(0);
};

const supportMixedNestedRoutes = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  await page.goto(`http://localhost:${appPort}/three/user/custom-tab`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el?.textContent, rootElm);
  // Should include conventional 'user' layout content
  expect(text?.includes('user layout')).toBeTruthy();
  // Should include config 'custom-tab' page content
  const customTab = await page.$('.custom-tab');
  const tabText = await page.evaluate(el => el?.textContent, customTab);
  expect(tabText).toBe('custom tab from config route');
  expect(errors.length).toBe(0);
};

const supportConfigWithCompanionFiles = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  // Should load data via server loader
  await page.goto(`http://localhost:${appPort}/three/product/123`, {
    waitUntil: ['networkidle0'],
  });
  const productPage = await page.$('.product-page');
  expect(productPage).not.toBeNull();
  const productId = await page.$('.product-id');
  const idText = await page.evaluate(el => el?.textContent, productId);
  expect(idText).toBe('product id: 123');
  const productName = await page.$('.product-name');
  const nameText = await page.evaluate(el => el?.textContent, productName);
  expect(nameText).toBe('product name: Product 123');

  // Should render error boundary when loader throws
  await page.goto(`http://localhost:${appPort}/three/product/error`, {
    waitUntil: ['domcontentloaded'],
  });
  await page.waitForSelector('.product-error');
  const errorElm = await page.$('.product-error');
  const errorText = await page.evaluate(el => el?.textContent, errorElm);
  expect(errorText?.includes('Product Error Boundary')).toBeTruthy();
  expect(errorText?.includes('Product load error')).toBeTruthy();
};

const supportDeepFileRoutesManipulation = async (
  page: Page,
  errors: string[],
  appPort: number,
) => {
  // Ensure that 'client-loader' route has been removed
  const response = await page.goto(
    `http://localhost:${appPort}/three/client-loader`,
    {
      waitUntil: ['domcontentloaded'],
    },
  );
  // After removal, it should be 404 or unmatched.
  // Since catch-all may exist, ensure no client-loader content is shown.
  const clientLoaderLayout = await page.$('.client-loader-layout');
  expect(clientLoaderLayout).toBeNull();
};

describe('dev with rspack', () => {
  let app: unknown;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(
      appDir,
      appPort,
      {},
      {
        BUNDLER: 'rspack',
      },
    );
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

    test('support handle loader error', async () =>
      supportHandleLoaderError(page, errors, appPort));
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
    test('support throw error', async () =>
      supportThrowError(page, errors, appPort));
    test('support throw response', async () => {
      await supportThrowResponse(page, errors, appPort, 500);
      await supportThrowResponse(page, errors, appPort, 200);
    });
    test('support return response', async () => {
      await supportReturnResponse(page, errors, appPort, 500);
      await supportReturnResponse(page, errors, appPort, 200);
    });
  });

  describe('router plugin', () => {
    test('basic usage', async () => {
      await testRouterPlugin(appDir);
    });
  });

  describe('client data', () => {
    test('support client data', async () => {
      await supportClientLoader(page, errors, appPort);
    });
  });

  describe('support action', () => {
    test('support action in CSR', async () => {
      await supportActionInCSR(page, errors, appPort);
    });
    test('support action in SSR', async () => {
      await supportActionInSSR(page, errors, appPort);
    });
  });

  describe('prefetch', () => {
    test('suppport prefetch', async () => {
      await supportPrefetchInIntentMode(page, errors, appPort);
    });
    test('support prefetch with shouldRevalidate', async () => {
      await supportPrefetchWithShouldRevalidate(page, errors, appPort);
    });
  });

  describe('support shouldRevalidate', () => {
    test('support shouldRevalidate in ssr', async () => {
      await supportShouldRevalidateInSSR(page, errors, appPort);
    });
    test('support shouldRevalidate in csr', async () => {
      await supportShouldRevalidateInCSR(page, errors, appPort);
    });
  });

  describe('config-only routes (two)', () => {
    test('render correctly', async () =>
      supportConfigOnlyRoutesRender(page, errors, appPort));
    test('loader works', async () =>
      supportConfigOnlyRoutesLoader(page, errors, appPort));
    test('catch all route works', async () =>
      supportConfigOnlyCatchAll(page, errors, appPort));
    test('error boundary works', async () =>
      supportConfigOnlyErrorBoundary(page, errors, appPort));
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('build with rspack', () => {
  let appPort: number;
  let app: unknown;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    const buildResult = await modernBuild(appDir, [], {
      env: {
        BUNDLER: 'rspack',
      },
    });

    if (buildResult.code !== 0) {
      console.log('ut test build failed, err: ', buildResult.stderr);
      console.log('ut test build failed, output: ', buildResult.stdout);
    }
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

    test('support handle loader error', async () =>
      supportHandleLoaderError(page, errors, appPort));
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
    test('support throw error', async () =>
      supportThrowError(page, errors, appPort));
    test('support throw response', async () => {
      await supportThrowResponse(page, errors, appPort, 500);
      await supportThrowResponse(page, errors, appPort, 200);
    });
    test('support return response', async () => {
      await supportReturnResponse(page, errors, appPort, 500);
      await supportReturnResponse(page, errors, appPort, 200);
    });
  });

  describe('router plugin', () => {
    test('basic usage', async () => {
      await testRouterPlugin(appDir);
    });
    test('the correct hash should be included in the bundler-runtime chunk', async () =>
      hasHashCorrectly(appDir));
  });

  describe('client data', () => {
    test('support client data', async () => {
      await supportClientLoader(page, errors, appPort);
    });
  });

  describe('support action', () => {
    test('support action in CSR', async () => {
      await supportActionInCSR(page, errors, appPort);
    });
    test('support action in SSR', async () => {
      await supportActionInSSR(page, errors, appPort);
    });
  });

  describe('prefetch', () => {
    test('suppport prefetch', async () => {
      await supportPrefetchInIntentMode(page, errors, appPort);
    });
    test('support prefetch with shouldRevalidate', async () => {
      await supportPrefetchWithShouldRevalidate(page, errors, appPort);
    });
  });

  describe('support shouldRevalidate', () => {
    test('support shouldRevalidate in ssr', async () => {
      await supportShouldRevalidateInSSR(page, errors, appPort);
    });
    test('support shouldRevalidate in csr', async () => {
      await supportShouldRevalidateInCSR(page, errors, appPort);
    });
  });

  describe('config-only routes (two)', () => {
    test('render correctly', async () =>
      supportConfigOnlyRoutesRender(page, errors, appPort));
    test('loader works', async () =>
      supportConfigOnlyRoutesLoader(page, errors, appPort));
    test('catch all route works', async () =>
      supportConfigOnlyCatchAll(page, errors, appPort));
    test('error boundary works', async () =>
      supportConfigOnlyErrorBoundary(page, errors, appPort));
  });

  describe('hybrid routes (three)', () => {
    test('config route overrides conventional route', async () =>
      supportConfigOverridesConventional(page, errors, appPort));
    test('config route supplements conventional routes', async () =>
      supportConfigSupplementsConventional(page, errors, appPort));
    test('mixed nested routes work correctly', async () =>
      supportMixedNestedRoutes(page, errors, appPort));
    test('config route with auto-discovered companion files', async () =>
      supportConfigWithCompanionFiles(page, errors, appPort));
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('routes inspect report', () => {
  beforeAll(async () => {
    const distDir = path.join(appDir, './dist');
    if (await fs.pathExists(distDir)) {
      await fs.remove(distDir);
    }

    await runModernCommand(['routes'], {
      cwd: appDir,
      stdout: true,
      stderr: true,
    });
  });
  test('should generate correct routes inspect report', async () => {
    const reportPath = path.join(appDir, './dist/routes-inspect.json');

    expect(await fs.pathExists(reportPath)).toBeTruthy();

    const report = await fs.readJSON(reportPath);

    expect(report).toHaveProperty('four');
    expect(report).toHaveProperty('three');
    expect(report.four).toHaveProperty('routes');
    expect(report.three).toHaveProperty('routes');

    const fourRoutes = report.four.routes;
    expect(fourRoutes).toHaveLength(1);

    const fourRoot = fourRoutes[0];
    expect(fourRoot.path).toBe('/');
    expect(fourRoot.component).toContain('@_modern_js_src/four/routes/layout');
    expect(fourRoot.children).toBeDefined();

    const fourChildren = fourRoot.children!;
    expect(fourChildren.length).toBeGreaterThan(0);

    const dynamicRoute = findRouteByPath(fourChildren, ':id');
    expect(dynamicRoute).toBeDefined();
    expect(dynamicRoute?.params).toEqual(['id']);
    expect(dynamicRoute?.data).toContain(
      '@_modern_js_src/four/routes/user/[id]/page.data',
    );

    const catchAllRoute = findRouteByPath(fourChildren, '*');
    expect(catchAllRoute).toBeDefined();

    const optionalRoute = findRouteByPath(fourChildren, 'act/:bid?');
    expect(optionalRoute).toBeDefined();
    expect(optionalRoute?.params).toEqual(['bid?']);

    const threeRoutes = report.three.routes;
    expect(threeRoutes).toHaveLength(1);

    const threeRoot = threeRoutes[0];
    expect(threeRoot.path).toBe('/');
    expect(threeRoot.component).toContain(
      '@_modern_js_src/three/routes/layout',
    );
    expect(threeRoot.error).toContain('@_modern_js_src/three/routes/error');
    expect(threeRoot.loading).toContain('@_modern_js_src/three/routes/loading');
    expect(threeRoot.config).toContain(
      '@_modern_js_src/three/routes/layout.config',
    );

    const threeChildren = threeRoot.children!;

    const authShopRoute = findRouteByPath(threeChildren, 'item');
    expect(authShopRoute).toBeDefined();
    expect(authShopRoute?.component).toContain(
      '@_modern_js_src/three/routes/__auth/__shop/item/page',
    );

    const clientLoaderRoute = findRouteByPath(threeChildren, 'client-loader');
    expect(clientLoaderRoute).toBeDefined();
    expect(clientLoaderRoute?.data).toContain(
      '@_modern_js_src/three/routes/client-loader/layout.data',
    );
    expect(clientLoaderRoute?.clientData).toContain(
      '@_modern_js_src/three/routes/client-loader/layout.data.client',
    );

    const errorRoute = findRouteByPath(threeChildren, 'error');
    expect(errorRoute).toBeDefined();
    expect(errorRoute?.component).toBe('');

    const dotRoute = findRouteByPath(threeChildren, 'user/profile/name');
    expect(dotRoute).toBeDefined();
    expect(dotRoute?.component).toContain(
      '@_modern_js_src/three/routes/user.profile.name/layout',
    );
    expect(dotRoute?.config).toContain(
      '@_modern_js_src/three/routes/user.profile.name/layout.config',
    );
  });
});
