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
