import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { PluginEntry } from '@modern-js/builder-webpack-provider/plugins/entry';
import { PluginHtml } from '@modern-js/builder-webpack-provider/plugins/html';
import { PluginCss } from '@modern-js/builder-webpack-provider/plugins/css';
import { PluginRem } from '@modern-js/builder-webpack-provider/plugins/rem';

test('plugin rem', async ({ page }) => {
  const builder = await createStubBuilder({
    webpack: 'in-memory',
    plugins: {
      builtin: false,
      additional: [PluginEntry(), PluginHtml(), PluginCss(), PluginRem()],
    },
    builderConfig: {
      output: {
        convertToRem: true,
      },
    },
    entry: { index: path.resolve('./src/index.js') },
  });
  const { homeUrl } = await builder.buildAndServe();

  await page.goto(homeUrl.href);
  expect(await page.evaluate('window.ROOT_FONT_SIZE')).toBe(64);
  expect(await page.evaluate('document.documentElement.style.fontSize')).toBe(
    '64px',
  );
});
