import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { getPublicPath } from '../testUtils';
import { launchApp, killApp } from '../../../utils/modernTestUtils';

let app: unknown;
let subApp1: unknown;
let subApp2: unknown;

test.afterAll(async () => {
  test.setTimeout(90 * 1000);
  await killApp(app);
  await killApp(subApp1);
  await killApp(subApp2);
});

test('render sub app', async ({ page }) => {
  [app, subApp1, subApp2] = await Promise.all([
    launchApp(join(__dirname, '../fixtures/main-router-v6')),
    launchApp(join(__dirname, '../fixtures/dashboard-router-v6')),
    launchApp(join(__dirname, '../fixtures/table')),
  ]);

  await page.goto(getPublicPath('@e2e/garfish-main-router-v6'));

  await page.waitForFunction(() => {
    return Boolean(document.querySelector('#renderMicroApp')?.innerHTML);
  });

  const renderMicroApp = await page.$('#renderMicroApp');
  await renderMicroApp?.click();

  await page.waitForFunction(() => {
    return Boolean(
      document.body.innerText.includes(
        'Props from main app: hello world from main app',
      ),
    );
  });

  expect(await page.textContent('body')).toContain('Dashboard App');
  expect(await page.textContent('body')).toContain('Main loader');

  const renderRoute = await page.$('#renderRoute');
  await renderRoute?.click();

  await page.waitForFunction(() => {
    return Boolean(document.body.innerText.includes('params: profile'));
  });

  expect(await page.textContent('body')).toContain('Dashboard detail page');
  expect(await page.textContent('body')).toContain('Dashboard loader');
});
