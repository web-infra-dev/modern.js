import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { PluginEntry } from '@modern-js/webpack-builder/plugins/entry';
import { PluginHtml } from '@modern-js/webpack-builder/plugins/html';
import { SwcPlugin } from '@modern-js/plugin-swc';

test('react', async ({ page }) => {
  const builder = await createStubBuilder({
    webpack: 'in-memory',
    plugins: {
      builtin: false,
      additional: [
        PluginEntry(),
        PluginHtml(),
        SwcPlugin({
          swc: {
            module: {
              type: 'commonjs',
              // ignoreDynamic: true,
            },
          },
        }),
      ],
    },
    entry: { index: path.resolve('./src/index.tsx') },
  });
  const { homeUrl } = await builder.buildAndServe({
    hangOn: false,
  });
  await page.goto(homeUrl.href);
  expect(await page.screenshot()).toMatchSnapshot();
});
