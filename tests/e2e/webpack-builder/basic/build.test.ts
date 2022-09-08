import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { expect, test } from '@modern-js/e2e/playwright';
import got from 'got';

test('basic', async ({ page }) => {
  const builder = createStubBuilder({ webpack: 'in-memory' });
  const baseurl = await builder.buildAndServe();
  const { body } = await got(`${baseurl}/dist/main.js`);
  expect(body).toBe('window.answer=42;');
  await page.goto(baseurl);
  expect(await page.evaluate('window.answer')).toBe(42);
});
