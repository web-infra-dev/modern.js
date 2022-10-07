import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { PluginEntry } from '@modern-js/builder-webpack-provider/plugins/entry';
import { PluginHtml } from '@modern-js/builder-webpack-provider/plugins/html';
import { SwcPlugin } from '@modern-js/builder-webpack-plugin-swc';

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
              ignoreDynamic: true,
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
