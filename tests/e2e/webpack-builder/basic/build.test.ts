import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { PluginHtml } from '@modern-js/webpack-builder/plugins/html';
import { expect, test } from '@modern-js/e2e/playwright';

test('basic', async ({ page }) => {
  const builder = createStubBuilder({ webpack: true, plugins: [PluginHtml()] });
  const { baseurl } = await builder.buildAndServe();
  await page.goto(baseurl);
  expect(await page.evaluate('window.answer')).toBe(42);
});
