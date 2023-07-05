import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';

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

test('bundlerChain', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'source/basic'),
    entry: {
      main: join(fixtures, 'source/basic/src/index.js'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        bundlerChain: chain => {
          chain.resolve.alias.merge({
            '@common': join(fixtures, 'source/basic/src/common'),
          });
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(page.innerHTML('#test')).resolves.toBe('Hello Builder! 1');

  builder.close();
});
