import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = resolve(__dirname, '../fixtures');

test('postcss plugins overwrite', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'output/rem'),
    entry: {
      main: join(fixtures, 'output/rem/src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    tools: {
      postcss: {
        postcssOptions: {
          plugins: [],
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('title').innerHTML`),
  ).resolves.toBe('title');
});

test('webpackChain plugin', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'source/global-vars'),
    entry: {
      main: join(fixtures, 'source/global-vars/src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    tools: {
      webpackChain: (chain, { webpack }) => {
        chain.plugin('define').use(webpack.DefinePlugin, [
          {
            ENABLE_TEST: JSON.stringify(true),
          },
        ]);
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(
    page.evaluate(`document.getElementById('test-el').innerHTML`),
  ).resolves.toBe('aaaaa');
});
