import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

const fixtures = resolve(__dirname, '../');

webpackOnlyTest('pug', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    html: {
      template: './static/index.pug',
    },
    tools: {
      pug: true,
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test-pug').innerHTML`),
  ).resolves.toBe('Pug source code!');

  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  builder.close();
});
