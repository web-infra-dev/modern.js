import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { getPublicPath } from '../testUtils';
import { launchApp, killApp } from '../../../utils/modernTestUtils';

let app: unknown;
let subApp1: unknown;
let subApp2: unknown;

test.setTimeout(90 * 1000);

test.beforeAll(async () => {
  [app, subApp1, subApp2] = await Promise.all([
    launchApp(join(__dirname, '../fixtures/main')),
    launchApp(join(__dirname, '../fixtures/dashboard')),
    launchApp(join(__dirname, '../fixtures/table')),
  ]);
});

test.afterAll(async () => {
  await killApp(app);
  await killApp(subApp1);
  await killApp(subApp2);
});

const mainAppName = '@e2e/garfish-main';

test('render sub app', async ({ page }) => {
  await page.goto(getPublicPath(mainAppName));

  await page.waitForFunction(() => {
    return Boolean(document.body.innerText.includes('Main Home page'));
  });

  const dashboardLink = await page.$('[data-test=link-dashboard]');
  await dashboardLink?.click();

  await page.waitForFunction(() => {
    return Boolean(document.body.innerText.includes('Dashboard Home page'));
  });

  expect(await page.textContent('body')).toContain(
    'main app info: hello world from main app',
  );

  const detailLink = await page.$('[data-test=link-dashboard-detail]');
  await detailLink?.click();

  await page.waitForFunction(() => {
    return Boolean(document.body.innerText.includes('Dashboard detail page'));
  });

  const tablelistLink = await page.$('[data-test=link-tablelist]');
  await tablelistLink?.click();
  await page.waitForFunction(() => {
    return Boolean(
      document.body.innerText.includes('tablelist empty placeholder'),
    );
  });
  await page.waitForFunction(() => {
    return Boolean(document.body.innerText.includes('Tablelist home page'));
  });

  const dashboardDetailLink = await page.$('[data-test=link-dashboard-detail]');
  await dashboardDetailLink?.click();
  const subLink = await page.$('[data-test=sub-link-dashboard]');
  await subLink?.click();
  expect(await page.textContent('body')).toContain('Dashboard detail page');
});

test('render module federation component', async ({ page }) => {
  await page.goto(getPublicPath(mainAppName));
  const link = await page.$('[data-test=link-shared]');
  await link?.click();
  expect(await page.textContent('body')).toContain(
    'A Module Federation Shared Button',
  );
});

test('dashboard app get basename from masterApp', async ({ page }) => {
  await page.goto(getPublicPath(mainAppName));
  const link = await page.$('[data-test=link-dashboard]');
  await link?.click();
  expect(await page.textContent('#basename')).toEqual('/test/dashboard');
});
