import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';
import { webpackOnlyTest } from '../scripts/helper';

const fixtures = __dirname;

test('postcss plugins overwrite', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'output/rem'),
    entry: {
      main: join(fixtures, 'output/rem/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        postcss: {
          postcssOptions: {
            plugins: [],
          },
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('title').innerHTML`),
  ).resolves.toBe('title');

  builder.close();
});

webpackOnlyTest('webpackChain plugin', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'source/global-vars'),
    entry: {
      main: join(fixtures, 'source/global-vars/src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        webpackChain: (chain, { webpack }) => {
          chain.plugin('define').use(webpack.DefinePlugin, [
            {
              ENABLE_TEST: JSON.stringify(true),
            },
          ]);
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(
    page.evaluate(`document.getElementById('test-el').innerHTML`),
  ).resolves.toBe('aaaaa');

  builder.close();
});
