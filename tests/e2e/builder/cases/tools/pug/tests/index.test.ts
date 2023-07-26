import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = resolve(__dirname, '../');

test('pug', async ({ page }) => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      html: {
        template: './static/index.pug',
      },
      tools: {
        pug: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const testPug = page.locator('#test-pug');
  await expect(testPug).toHaveText('Pug source code!');

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Builder!');

  builder.close();
});
