// fork from the tests/integration/routes
import type { Page } from 'puppeteer';

export const renderSelfRoute = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/one`, {
    waitUntil: ['networkidle0'],
  });
  const description = await page.$('.description');
  const targetText = await page.evaluate(el => el.textContent, description);
  expect(targetText.trim()).toEqual('Get started by editing src/App.tsx');
  expect(errors.length).toEqual(0);
};

export const renderPageRoute = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/two/user`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.user');
  const targetText = await page.evaluate(el => el.textContent, element);
  expect(targetText.trim()).toEqual('user');
  expect(errors.length).toEqual(0);
};

export const renderDynamaticRoute = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/two/item/1234`, {
    waitUntil: ['networkidle0'],
  });
  const element = await page.$('.item');
  const targetText = await page.evaluate(el => el.textContent, element);
  expect(targetText.trim()).toEqual('1234');
  expect(errors.length).toEqual(0);
};

export const supportGlobalLayout = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
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

export const supportLayout = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
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

export const nestedRouteOverPage = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/three`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeTruthy();
  expect(text.includes('page index')).toBeFalsy();
  expect(errors.length).toEqual(0);
};

export const supportNestedRouteAndPage = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/three/item/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('root layout')).toBeFalsy();
  expect(text.includes('1234')).toBeTruthy();

  await page.goto(`http://localhost:${appPort}/three/user/1234`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm1 = await page.$('#root');
  const text1 = await page.evaluate(el => el.textContent, rootElm1);
  expect(text1.includes('root layout')).toBeTruthy();
  expect(text1.includes('1234')).toBeTruthy();
};

export const supportLoaderForCSR = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/three/user/123`, {
    waitUntil: ['networkidle0'],
  });
  const rootElm = await page.$('#root');
  const text = await page.evaluate(el => el.textContent, rootElm);
  expect(text.includes('user layout')).toBeTruthy();
  expect(errors.length).toBe(0);
};

export const supportDefineInit = async (
  errors: string[],
  appPort: number,
  page: Page,
) => {
  await page.goto(`http://localhost:${appPort}/three/user`, {
    waitUntil: ['networkidle0'],
  });
  const isBrowser = await page.evaluate(() => (window as any).__isBrowser);

  expect(isBrowser).toBeTruthy();
  expect(errors.length).toBe(0);
};
