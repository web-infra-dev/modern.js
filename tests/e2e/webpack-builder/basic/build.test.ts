import path from 'path';
import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { PluginEntry } from '@modern-js/webpack-builder/plugins/entry';
import { PluginHtml } from '@modern-js/webpack-builder/plugins/html';
import { expect, test } from '@modern-js/e2e/playwright';

test('basic', async ({ page }) => {
  const builder = createStubBuilder({
    webpack: 'in-memory',
    plugins: [PluginEntry(), PluginHtml()],
    entry: { index: path.resolve('./src/index.js') },
  });
  const { baseurl } = await builder.buildAndServe();
  await page.goto(`${baseurl}/html/index`);
  expect(await page.evaluate('window.answer')).toBe(42);
  await page.evaluate('document.write(window.answer)');
  expect(await page.screenshot()).toMatchSnapshot();
});
